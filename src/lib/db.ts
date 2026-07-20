import Database from "@tauri-apps/plugin-sql";
import { isTauri } from "@tauri-apps/api/core";

let _db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!_db) {
    _db = await Database.load("sqlite:wavely.db");
  }
  return _db;
}

type ErrorReporter = (message: string) => void;
let reportError: ErrorReporter = () => {};

/** Wired up once at app startup so failed writes can surface a toast. */
export function setErrorReporter(reporter: ErrorReporter) {
  reportError = reporter;
}

const DEFAULT_RETRIES = 2;
const RETRY_DELAY_MS = 250;

async function withRetry<T>(fn: () => Promise<T>, errorMessage?: string): Promise<T> {
  // In the browser preview (no Tauri runtime), every DB call fails immediately and
  // permanently — retrying and toasting would just be noise, so fail fast instead.
  if (!isTauri()) return fn();

  let lastErr: unknown;
  for (let attempt = 0; attempt <= DEFAULT_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < DEFAULT_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  }
  if (errorMessage) reportError(errorMessage);
  throw lastErr;
}

/** Retrying write helper. Reports a toast if every retry fails inside the real app. */
export async function dbExecute(sql: string, params: unknown[] = [], errorMessage?: string): Promise<void> {
  await withRetry(async () => {
    const db = await getDb();
    await db.execute(sql, params);
  }, errorMessage);
}

/** Retrying read helper. Fails quietly (callers already fall back to empty state). */
export async function dbSelect<T>(sql: string, params: unknown[] = []): Promise<T> {
  return withRetry(async () => {
    const db = await getDb();
    return db.select<T>(sql, params);
  });
}
