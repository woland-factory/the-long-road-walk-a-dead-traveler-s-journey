import type { WalkerState } from "./types";
import { migrate } from "./store";

// Export and import of the single walker record as one JSON file. This is the
// app's one real input boundary, so parseBackup validates everything before a
// byte of it can touch state. It never throws and never logs file contents.

export const BACKUP_FORMAT = "the-long-road/walker-state";
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export interface BackupEnvelope {
  format: string; // BACKUP_FORMAT
  version: number; // state.schemaVersion at export time
  exportedAt: string; // ISO timestamp (passed in by the caller)
  state: WalkerState;
}

// Pretty JSON so the file is human-inspectable: owning your data includes
// being able to read it.
export function serializeBackup(state: WalkerState, exportedAt: string): string {
  const envelope: BackupEnvelope = {
    format: BACKUP_FORMAT,
    version: state.schemaVersion,
    exportedAt,
    state,
  };
  return JSON.stringify(envelope, null, 2);
}

export type ImportResult =
  | { ok: true; state: WalkerState }
  | { ok: false; message: string };

// Shared with the restore UI so the up-front file-size check and the parser
// speak with one voice.
export const BACKUP_MESSAGES = {
  notABackup: "Choose the .json backup this app saved. Use Save a backup to make one.",
  tooLarge: "That file is too big to be a backup. Choose the .json file this app saved.",
} as const;

const NOT_A_BACKUP = BACKUP_MESSAGES.notABackup;
const TOO_LARGE = BACKUP_MESSAGES.tooLarge;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isDailyLog(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (e) =>
        isPlainObject(e) && typeof e.date === "string" && typeof e.miles === "number",
    )
  );
}

function isPersonalLog(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (e) =>
        isPlainObject(e) &&
        typeof e.date === "string" &&
        typeof e.milepostId === "string" &&
        typeof e.text === "string",
    )
  );
}

function isStringArray(value: unknown): boolean {
  return Array.isArray(value) && value.every((s) => typeof s === "string");
}

// The common shape every schema version shares. personalLog arrived in v2, so
// it is required only from version 2 on; migrate() adds it to a v1 record.
function hasWalkerShape(state: Record<string, unknown>): boolean {
  if (typeof state.schemaVersion !== "number") return false;
  if (typeof state.activePackId !== "string") return false;
  if (typeof state.createdAt !== "string") return false;
  if (!isDailyLog(state.dailyLog)) return false;
  if (typeof state.cumulativeMiles !== "number") return false;
  if (!isStringArray(state.reachedMilepostIds)) return false;
  if (state.schemaVersion >= 2 && !isPersonalLog(state.personalLog)) return false;
  return true;
}

// Guarded end to end: parse, envelope shape, state shape, then migrate().
// Any failure returns { ok: false } with a friendly message and never throws.
export function parseBackup(text: string): ImportResult {
  if (text.length > MAX_BACKUP_BYTES) {
    return { ok: false, message: TOO_LARGE };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, message: NOT_A_BACKUP };
  }
  if (!isPlainObject(parsed)) return { ok: false, message: NOT_A_BACKUP };
  if (parsed.format !== BACKUP_FORMAT) return { ok: false, message: NOT_A_BACKUP };
  if (!isPlainObject(parsed.state)) return { ok: false, message: NOT_A_BACKUP };
  if (!hasWalkerShape(parsed.state)) return { ok: false, message: NOT_A_BACKUP };
  const migrated = migrate(parsed.state);
  if (!migrated) return { ok: false, message: NOT_A_BACKUP };
  return { ok: true, state: migrated };
}
