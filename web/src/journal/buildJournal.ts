import type { JourneyPack, Voice } from "../packs/types";
import type { WalkerState } from "../state/types";
import { facingLineFor } from "../state/personalLog";
import { dateline } from "../trail/dateline";

// The pure interleave: walker state plus the pack becomes the ordered list of
// facing-page spreads. This is the journal's half of the withholding boundary:
// only mileposts in reachedMilepostIds produce a spread, so an unearned
// entry's text is never read here. No IndexedDB, no React, no Date.

export interface JournalSpread {
  milepostId: string;
  mileMark: number;
  place: string;
  travelerDate: string; // milepost.date, raw ISO (1867-...)
  travelerDateline: string; // formatted via dateline()
  approxNote: string;
  voices: Voice[]; // verbatim, earned; never mutated
  walkerLine: string; // personalLog text for this milepost, "" if none
  reachedDate: string; // real YYYY-MM-DD the crossing happened
  reachedDateline: string; // formatted via dateline()
}

// Round to hundredths at every step so decimal miles never drift, matching
// the odometer's summation.
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// The date of the first dailyLog entry whose running cumulative total reaches
// each mileMark. Built in one pass; the last entry is the safe fallback for
// any reached milepost (reached implies the log's total covers its mark).
function reachedDates(state: WalkerState, mileMarks: number[]): Map<number, string> {
  const dates = new Map<number, string>();
  const pending = [...mileMarks].sort((a, b) => a - b);
  let running = 0;
  let i = 0;
  for (const entry of state.dailyLog) {
    running = round2(running + entry.miles);
    while (i < pending.length && pending[i] <= running) {
      dates.set(pending[i], entry.date);
      i += 1;
    }
  }
  const fallback = state.dailyLog[state.dailyLog.length - 1]?.date ?? "";
  while (i < pending.length) {
    dates.set(pending[i], fallback);
    i += 1;
  }
  return dates;
}

// Ordered ascending by mileMark. Includes ONLY reached mileposts.
export function buildJournal(state: WalkerState, pack: JourneyPack): JournalSpread[] {
  const reached = new Set(state.reachedMilepostIds);
  const mileposts = pack.mileposts
    .filter((m) => reached.has(m.id))
    .sort((a, b) => a.mileMark - b.mileMark);
  const dates = reachedDates(state, mileposts.map((m) => m.mileMark));
  return mileposts.map((m) => {
    const reachedDate = dates.get(m.mileMark) ?? "";
    return {
      milepostId: m.id,
      mileMark: m.mileMark,
      place: m.place,
      travelerDate: m.date,
      travelerDateline: dateline(m.date),
      approxNote: m.approxNote,
      voices: m.voices,
      walkerLine: facingLineFor(state, m.id),
      reachedDate,
      reachedDateline: dateline(reachedDate),
    };
  });
}
