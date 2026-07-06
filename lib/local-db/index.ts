"use client";

import type {
  LocalMetaRecord,
  LocalRecordBase,
  LocalStoreName,
  LocalStoreSchema,
} from "@/lib/offline/types";

const DB_NAME = "yumo-offline-cache";
const DB_VERSION = 8;
const STORE_NAMES: LocalStoreName[] = [
  "receipts",
  "receipt_images",
  "user_profile",
  "quests",
  "progress",
  "wallet",
  "dashboard_summary",
  "insights",
  "app_config",
  "notifications",
  "leaderboard",
  "meta",
  "budgets",
  "subscriptions",
  "financial_goals",
  "receipt_line_items",
  "commitments",
  "insight_events",
];

const CHANGE_EVENT = "yumo-local-db-change";

type ChangeDetail = {
  stores: LocalStoreName[];
};

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryFallback = new Map<LocalStoreName, Map<string, LocalRecordBase>>();

function deleteIndexedDb(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const del = window.indexedDB.deleteDatabase(name);
    del.onsuccess = () => resolve();
    del.onerror = () => reject(del.error ?? new Error("deleteDatabase failed"));
    del.onblocked = () =>
      reject(new Error("IndexedDB delete blocked — close other tabs using this site and retry."));
  });
}

function isVersionTooLowError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    err.name === "VersionError" &&
    /less than the existing version/i.test(err.message)
  );
}

function openIndexedDbAttempt(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const storeName of STORE_NAMES) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, { keyPath: "id" });
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function getMemoryStore(store: LocalStoreName) {
  let bucket = memoryFallback.get(store);
  if (!bucket) {
    bucket = new Map<string, LocalRecordBase>();
    memoryFallback.set(store, bucket);
  }
  return bucket;
}

function notifyStoresChanged(stores: LocalStoreName[]) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ChangeDetail>(CHANGE_EVENT, { detail: { stores } }));
}

async function openDatabaseWithRepair(): Promise<IDBDatabase> {
  try {
    return await openIndexedDbAttempt();
  } catch (e: unknown) {
    if (!isVersionTooLowError(e)) throw e;
    await deleteIndexedDb(DB_NAME);
    return await openIndexedDbAttempt();
  }
}

async function getDatabase(): Promise<IDBDatabase> {
  if (!isIndexedDbAvailable()) {
    throw new Error("IndexedDB unavailable");
  }
  dbPromise ??= openDatabaseWithRepair().catch((err) => {
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function runTransaction<T>(
  database: IDBDatabase,
  storeName: LocalStoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  return new Promise((resolve, reject) => {
    const tx = database.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = fn(store);
    request.onerror = () => reject(request.error ?? new Error(`IndexedDB request failed: ${storeName}`));
    request.onsuccess = () => resolve(request.result as T);
  });
}

function ensureBaseRecord<T extends LocalRecordBase>(record: T): T {
  if (!record.id || !record.updated_at || typeof record.version !== "number") {
    throw new Error("Local DB records require id, updated_at, and version");
  }
  return record;
}

async function getRecordInternal<K extends LocalStoreName>(
  storeName: K,
  id: string
): Promise<LocalStoreSchema[K] | null> {
  if (!isIndexedDbAvailable()) {
    return (getMemoryStore(storeName).get(id) as LocalStoreSchema[K] | undefined) ?? null;
  }
  const database = await getDatabase();
  // IndexedDB's store.get resolves to `undefined` for a missing key; normalize to
  // null so callers (and React Query) never see undefined.
  const result = await runTransaction<LocalStoreSchema[K] | undefined>(database, storeName, "readonly", (store) =>
    store.get(id)
  );
  return result ?? null;
}

async function listRecordsInternal<K extends LocalStoreName>(storeName: K): Promise<LocalStoreSchema[K][]> {
  if (!isIndexedDbAvailable()) {
    return Array.from(getMemoryStore(storeName).values()) as LocalStoreSchema[K][];
  }
  const database = await getDatabase();
  return runTransaction<LocalStoreSchema[K][]>(database, storeName, "readonly", (store) => store.getAll());
}

async function putRecordInternal<K extends LocalStoreName>(storeName: K, record: LocalStoreSchema[K]): Promise<void> {
  ensureBaseRecord(record);
  if (!isIndexedDbAvailable()) {
    getMemoryStore(storeName).set(record.id, record as LocalRecordBase);
    notifyStoresChanged([storeName]);
    return;
  }
  const database = await getDatabase();
  await runTransaction(database, storeName, "readwrite", (store) => store.put(record));
  notifyStoresChanged([storeName]);
}

async function deleteRecordInternal<K extends LocalStoreName>(storeName: K, id: string): Promise<void> {
  if (!isIndexedDbAvailable()) {
    getMemoryStore(storeName).delete(id);
    notifyStoresChanged([storeName]);
    return;
  }
  const database = await getDatabase();
  await runTransaction(database, storeName, "readwrite", (store) => store.delete(id));
  notifyStoresChanged([storeName]);
}

export const localDb = {
  async get<K extends LocalStoreName>(storeName: K, id: string): Promise<LocalStoreSchema[K] | null> {
    return getRecordInternal(storeName, id);
  },

  async set<K extends LocalStoreName>(storeName: K, record: LocalStoreSchema[K]): Promise<LocalStoreSchema[K]> {
    await putRecordInternal(storeName, record);
    return record;
  },

  async bulkSet<K extends LocalStoreName>(storeName: K, records: LocalStoreSchema[K][]): Promise<void> {
    if (records.length === 0) return;
    for (const record of records) {
      ensureBaseRecord(record);
    }

    if (!isIndexedDbAvailable()) {
      const store = getMemoryStore(storeName);
      for (const record of records) {
        store.set(record.id, record as LocalRecordBase);
      }
      notifyStoresChanged([storeName]);
      return;
    }

    const database = await getDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      for (const record of records) {
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB bulkSet failed: ${storeName}`));
      tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB bulkSet aborted: ${storeName}`));
    });
    notifyStoresChanged([storeName]);
  },

  async patch<K extends LocalStoreName>(
    storeName: K,
    id: string,
    patch: Partial<LocalStoreSchema[K]> & Pick<LocalRecordBase, "updated_at" | "version">
  ): Promise<LocalStoreSchema[K] | null> {
    const current = await getRecordInternal(storeName, id);
    if (!current) return null;
    const next = { ...current, ...patch, id } as LocalStoreSchema[K];
    ensureBaseRecord(next);
    await putRecordInternal(storeName, next);
    return next;
  },

  async list<K extends LocalStoreName>(storeName: K): Promise<LocalStoreSchema[K][]> {
    return listRecordsInternal(storeName);
  },

  async clear<K extends LocalStoreName>(storeName: K): Promise<void> {
    if (!isIndexedDbAvailable()) {
      getMemoryStore(storeName).clear();
      notifyStoresChanged([storeName]);
      return;
    }
    const database = await getDatabase();
    await runTransaction(database, storeName, "readwrite", (store) => store.clear());
    notifyStoresChanged([storeName]);
  },

  async delete<K extends LocalStoreName>(storeName: K, id: string): Promise<void> {
    await deleteRecordInternal(storeName, id);
  },

  async clearAll(): Promise<void> {
    for (const storeName of STORE_NAMES) {
      await localDb.clear(storeName);
    }
  },
};

export function subscribeLocalDbChanges(listener: (stores: LocalStoreName[]) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<ChangeDetail>).detail;
    listener(detail?.stores ?? []);
  };
  window.addEventListener(CHANGE_EVENT, handler as EventListener);
  return () => window.removeEventListener(CHANGE_EVENT, handler as EventListener);
}

export async function getMetaValue(id: string): Promise<string | null> {
  const record = await localDb.get("meta", id);
  return record?.value ?? null;
}

export async function setMetaValue(id: string, value: string | null): Promise<LocalMetaRecord> {
  const nowIso = new Date().toISOString();
  const record: LocalMetaRecord = {
    id,
    value,
    updated_at: nowIso,
    version: Date.parse(nowIso),
  };
  await localDb.set("meta", record);
  return record;
}
