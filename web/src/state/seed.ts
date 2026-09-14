import type { JourneyPack } from "../packs/types";
import type { WalkerState } from "./types";
import { addMiles, freshState } from "./odometer";

// Build a seeded walker whose logged miles have already crossed the pack's
// first two mileposts, so a stranger sees two earned entries and one still
// withheld on first load. Deterministic (fixed dates) so tests and demos are
// stable. Pack-aware: the seed lands just past the SECOND real milepost.
export function buildSeededState(pack: JourneyPack): WalkerState {
  let state = freshState(pack.id, "2026-09-01T08:00:00.000Z");
  const marks = pack.mileposts;

  if (marks.length >= 2) {
    // Cross the first milepost, then cross the second, leaving the third withheld.
    const entry1 = marks[0].mileMark + 1;
    const entry2 = marks[1].mileMark + 2 - entry1;
    state = addMiles(state, entry1, "2026-09-01", pack);
    state = addMiles(state, entry2, "2026-09-02", pack);
    // For the fixture (marks 5, 12) this is 6 then 8 (total 14): fx-1 and fx-2
    // reached, fx-3 withheld. For Muir it crosses his first two real mileposts.
  } else if (marks.length === 1) {
    state = addMiles(state, marks[0].mileMark + 1, "2026-09-01", pack);
  }

  return state;
}
