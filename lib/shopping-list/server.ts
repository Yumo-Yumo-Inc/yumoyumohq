import { sql } from "@/lib/db/client";

export type ShoppingItemSource = "manual" | "suggestion" | "recent_purchase" | "favorite";

export type ShoppingListItem = {
  id: number;
  name: string;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  canonicalId: string | null;
  suggestedBrand: string | null;
  source: ShoppingItemSource;
};

type Row = {
  id: number;
  name: string;
  position: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  canonical_id: string | null;
  suggested_brand: string | null;
  source: ShoppingItemSource;
};

function rowToItem(row: Row): ShoppingListItem {
  return {
    id: Number(row.id),
    name: row.name,
    position: row.position,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    canonicalId: row.canonical_id,
    suggestedBrand: row.suggested_brand,
    source: row.source,
  };
}


export async function listShoppingItems(username: string): Promise<ShoppingListItem[]> {
  const rows = (await sql`
    SELECT id, name, position, completed_at, created_at, updated_at,
           canonical_id, suggested_brand, source
    FROM shopping_list_items
    WHERE username = ${username}
      AND (completed_at IS NULL OR completed_at > NOW() - INTERVAL '24 hours')
    ORDER BY completed_at NULLS FIRST, position ASC, id ASC
  `) as Row[];
  return rows.map(rowToItem);
}

export type AddShoppingItemInput = {
  name: string;
  canonicalId?: string | null;
  suggestedBrand?: string | null;
  rawInput?: string | null;
  source?: ShoppingItemSource;
};

export async function addShoppingItem(
  username: string,
  input: AddShoppingItemInput | string,
): Promise<ShoppingListItem | null> {
  // Backward compatibility: eski caller'lar plain string yolluyor.
  const normalized: AddShoppingItemInput =
    typeof input === "string" ? { name: input } : input;

  const trimmed = normalized.name.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return null;

  const canonicalId = normalized.canonicalId ?? null;
  const suggestedBrand = normalized.suggestedBrand ?? null;
  const rawInput = normalized.rawInput ?? trimmed;
  const source: ShoppingItemSource = normalized.source ?? (canonicalId ? "suggestion" : "manual");

  const countRows = (await sql`
    SELECT COUNT(*)::int AS count
    FROM shopping_list_items
    WHERE username = ${username} AND completed_at IS NULL
  `) as { count: number }[];
  if ((countRows[0]?.count ?? 0) >= 30) return null;

  const posRows = (await sql`
    SELECT COALESCE(MAX(position), 0) + 1 AS next_position
    FROM shopping_list_items
    WHERE username = ${username} AND completed_at IS NULL
  `) as { next_position: number }[];
  const nextPosition = posRows[0]?.next_position ?? 1;

  const rows = (await sql`
    INSERT INTO shopping_list_items
      (username, name, position, canonical_id, suggested_brand, raw_input, source)
    VALUES
      (${username}, ${trimmed}, ${nextPosition}, ${canonicalId}, ${suggestedBrand}, ${rawInput}, ${source})
    RETURNING id, name, position, completed_at, created_at, updated_at,
              canonical_id, suggested_brand, source
  `) as Row[];

  return rowToItem(rows[0]);
}

export async function toggleShoppingItem(
  username: string,
  id: number,
  completed: boolean
): Promise<ShoppingListItem | null> {
  const rows = (await sql`
    UPDATE shopping_list_items
    SET completed_at = CASE WHEN ${completed}::boolean THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = ${id} AND username = ${username}
    RETURNING id, name, position, completed_at, created_at, updated_at,
              canonical_id, suggested_brand, source
  `) as Row[];
  return rows.length > 0 ? rowToItem(rows[0]) : null;
}

export async function deleteShoppingItem(username: string, id: number): Promise<boolean> {
  const rows = (await sql`
    DELETE FROM shopping_list_items
    WHERE id = ${id} AND username = ${username}
    RETURNING id
  `) as { id: number }[];
  return rows.length > 0;
}

export async function renameShoppingItem(
  username: string,
  id: number,
  name: string
): Promise<ShoppingListItem | null> {
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 80) return null;

  const rows = (await sql`
    UPDATE shopping_list_items
    SET name = ${trimmed}, updated_at = NOW()
    WHERE id = ${id} AND username = ${username}
    RETURNING id, name, position, completed_at, created_at, updated_at,
              canonical_id, suggested_brand, source
  `) as Row[];
  return rows.length > 0 ? rowToItem(rows[0]) : null;
}
