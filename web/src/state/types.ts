// Walker state, versioned so later EPICs add fields by forward-only migration
// rather than breaking reads.

export interface DailyLogEntry {
  date: string; // YYYY-MM-DD
  miles: number;
}

export interface WalkerStateV1 {
  schemaVersion: 1;
  activePackId: string;
  createdAt: string; // ISO timestamp of first load
  dailyLog: DailyLogEntry[]; // source of truth
  cumulativeMiles: number; // derived from dailyLog, stored for O(1) reads
  reachedMilepostIds: string[]; // derived: mileposts with mileMark <= cumulativeMiles
}

// The union grows in later EPICs.
export type WalkerState = WalkerStateV1;

export const CURRENT_SCHEMA_VERSION = 1 as const;
