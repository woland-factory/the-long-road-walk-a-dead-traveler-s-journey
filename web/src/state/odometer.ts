import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "./types";
import { CURRENT_SCHEMA_VERSION } from "./types";

// Pure odometer logic: no IndexedDB, no React. Cheap to test exhaustively.

// Sum the daily log, rounding to hundredths so floating-point addition of
// decimal miles never drifts (e.g. 0.1 + 0.2).
function sumMiles(dailyLog: { miles: number }[]): number {
  const total = dailyLog.reduce((acc, entry) => acc + entry.miles, 0);
  return Math.round(total * 100) / 100;
}

function computeReached(cumulativeMiles: number, pack: JourneyPack): string[] {
  return pack.mileposts
    .filter((m) => m.mileMark <= cumulativeMiles)
    .map((m) => m.id);
}

// Recompute derived fields from the daily log so they can never drift from
// the source of truth. Used on every write and on load.
export function recompute(state: WalkerState, pack: JourneyPack): WalkerState {
  const cumulativeMiles = sumMiles(state.dailyLog);
  return {
    ...state,
    cumulativeMiles,
    reachedMilepostIds: computeReached(cumulativeMiles, pack),
  };
}

// Append today's miles and recompute derived fields.
export function addMiles(
  state: WalkerState,
  milesToday: number,
  today: string,
  pack: JourneyPack,
): WalkerState {
  const dailyLog = [...state.dailyLog, { date: today, miles: milesToday }];
  return recompute({ ...state, dailyLog }, pack);
}

// Ids reached by the transition from `before` to `after`, for reveal.
export function newlyReached(before: WalkerState, after: WalkerState): string[] {
  const known = new Set(before.reachedMilepostIds);
  return after.reachedMilepostIds.filter((id) => !known.has(id));
}

// Distance to the nearest unreached milepost, or null once all are reached.
export function milesToNext(state: WalkerState, pack: JourneyPack): number | null {
  const next = pack.mileposts
    .filter((m) => m.mileMark > state.cumulativeMiles)
    .sort((a, b) => a.mileMark - b.mileMark)[0];
  if (!next) return null;
  return Math.round((next.mileMark - state.cumulativeMiles) * 100) / 100;
}

// A fresh walker for the given pack.
export function freshState(packId: string, createdAt: string): WalkerState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    activePackId: packId,
    createdAt,
    dailyLog: [],
    cumulativeMiles: 0,
    reachedMilepostIds: [],
  };
}
