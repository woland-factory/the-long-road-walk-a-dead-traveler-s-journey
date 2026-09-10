import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "./types";
import { addMiles, freshState } from "./odometer";

// Build a seeded walker whose logged miles have already crossed the first
// fixture milepost, so a stranger sees an earned entry on first load.
// Deterministic (fixed dates) so tests and demos are stable.
export function buildSeededState(pack: JourneyPack): WalkerState {
  let state = freshState(pack.id, "2026-09-01T08:00:00.000Z");
  state = addMiles(state, 6, "2026-09-01", pack);
  state = addMiles(state, 8, "2026-09-02", pack);
  return state; // 14 miles total: fx-1 and fx-2 reached, fx-3 withheld
}
