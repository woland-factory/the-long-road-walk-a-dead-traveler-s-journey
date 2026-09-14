// Walker state, versioned so later EPICs add fields by forward-only migration
// rather than breaking reads.

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  miles: number;
}

// The walker's own one line facing a reached milepost's entry. Stored locally
// so it survives reload; interleaving it with the diary is EPIC 4's job.
export interface PersonalEntry {
  date: string; // YYYY-MM-DD the line was written (local time)
  milepostId: string; // the reached milepost this line faces
  text: string; // the walker's one facing line, trimmed and whitespace-collapsed
}

export interface WalkerStateV1 {
  // kept for the migration only
  schemaVersion: 1;
  activePackId: string;
  createdAt: string; // ISO timestamp of first load
  dailyLog: DailyLogEntry[]; // source of truth
  cumulativeMiles: number; // derived from dailyLog, stored for O(1) reads
  reachedMilepostIds: string[]; // derived: mileposts with mileMark <= cumulativeMiles
}

export interface WalkerStateV2 {
  schemaVersion: 2;
  activePackId: string;
  createdAt: string;
  dailyLog: DailyLogEntry[];
  cumulativeMiles: number;
  reachedMilepostIds: string[];
  personalLog: PersonalEntry[]; // NEW: the walker's facing lines, keyed by milepostId
}

export type WalkerState = WalkerStateV2;

export const CURRENT_SCHEMA_VERSION = 2 as const;
