import { openDB, type IDBPDatabase } from "idb";
import type { WalkerState } from "./types";

// IndexedDB-backed persistence for the single walker record.
// This is the storage seam later EPICs extend (new fields via migrate()).

const DB_NAME = "the-long-road";
const DB_VERSION = 1;
const STORE = "walker";
const KEY = "walkerState";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      },
    });
  }
  return dbPromise;
}

// Forward-only migration. Switches on schemaVersion; an unknown or absent
// version is treated as fresh (null) rather than throwing, so a stale or
// corrupt record can never crash the app. Later EPICs add case branches.
export function migrate(raw: unknown): WalkerState | null {
  if (!raw || typeof raw !== "object") return null;
  const version = (raw as { schemaVersion?: unknown }).schemaVersion;
  switch (version) {
    case 1:
      return raw as WalkerState;
    default:
      return null;
  }
}

export async function loadState(): Promise<WalkerState | null> {
  const db = await getDB();
  const raw = await db.get(STORE, KEY);
  return migrate(raw);
}

export async function saveState(state: WalkerState): Promise<void> {
  const db = await getDB();
  await db.put(STORE, state, KEY);
}

// Test-only reset so suites start from a clean database.
export function __resetDbForTests(): void {
  dbPromise = null;
}
