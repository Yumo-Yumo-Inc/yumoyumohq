import { AsyncLocalStorage } from "async_hooks";

type ConsoleCaptureStore = {
  logBuffer: string[];
};

const installKey = Symbol.for("yumoyumo.requestConsoleCaptureInstalled");
const storageKey = Symbol.for("yumoyumo.requestConsoleCaptureStorage");
const globalState = globalThis as typeof globalThis & Record<symbol, unknown>;
const consoleCaptureStorage =
  (globalState[storageKey] as AsyncLocalStorage<ConsoleCaptureStore> | undefined) ??
  new AsyncLocalStorage<ConsoleCaptureStore>();
globalState[storageKey] = consoleCaptureStorage;

function stringifyConsoleArg(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      return "[unserializable object]";
    }
  }
  return String(value);
}

function pushCapturedLine(args: unknown[]): void {
  const store = consoleCaptureStorage.getStore();
  if (!store) return;
  store.logBuffer.push(args.map(stringifyConsoleArg).join(" "));
}

export function installRequestConsoleCapture(): void {
  if (globalState[installKey]) return;

  const originalLog = console.log.bind(console);
  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.log = (...args: unknown[]) => {
    pushCapturedLine(args);
    originalLog(...args);
  };
  console.error = (...args: unknown[]) => {
    pushCapturedLine(args);
    originalError(...args);
  };
  console.warn = (...args: unknown[]) => {
    pushCapturedLine(args);
    originalWarn(...args);
  };

  globalState[installKey] = true;
}

export function runWithConsoleLogBuffer<T>(
  logBuffer: string[],
  callback: () => T
): T {
  installRequestConsoleCapture();
  return consoleCaptureStorage.run({ logBuffer }, callback);
}
