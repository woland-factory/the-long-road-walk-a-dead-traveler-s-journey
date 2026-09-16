import type { DailyLogEntry } from "../state/types";
import type { DayTotal } from "./csv";
import { MAX_MILES_PER_CHECKIN } from "../trail/validate";

// The honest merge. Both import formats reduce to DayTotal[]; this plans which
// days are added and why the rest are left out, so nothing changes state until
// the walker has seen the counts. The rules can never double count a day or
// unlock an entry the feet did not earn.

export interface MergePlan {
  adds: DayTotal[]; // days that will be added, ascending by date
  addedMiles: number; // rounded sum of adds
  skippedExisting: number; // date already present in dailyLog (the walker's log wins)
  skippedFuture: number; // date after `today`
  skippedOverMax: number; // total above the per-day check-in bound
  skippedEmpty: number; // total zero or less
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function planMerge(
  days: DayTotal[],
  dailyLog: DailyLogEntry[],
  today: string,
): MergePlan {
  const existing = new Set(dailyLog.map((e) => e.date));
  const claimed = new Set<string>(); // dates already taken by an earlier add
  const adds: DayTotal[] = [];
  let skippedExisting = 0;
  let skippedFuture = 0;
  let skippedOverMax = 0;
  let skippedEmpty = 0;

  for (const day of days) {
    // The walker's own log always wins; re-importing the same file adds nothing.
    if (existing.has(day.date) || claimed.has(day.date)) {
      skippedExisting++;
      continue;
    }
    if (day.miles <= 0) {
      skippedEmpty++;
      continue;
    }
    if (day.date > today) {
      skippedFuture++;
      continue;
    }
    if (day.miles > MAX_MILES_PER_CHECKIN) {
      skippedOverMax++;
      continue;
    }
    claimed.add(day.date);
    adds.push(day);
  }

  adds.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const addedMiles = round2(adds.reduce((sum, d) => sum + d.miles, 0));
  return { adds, addedMiles, skippedExisting, skippedFuture, skippedOverMax, skippedEmpty };
}

// The merged log: existing entries plus the planned adds, sorted ascending by
// date. Array.sort is stable, so same-date manual entries keep their order and
// past days that arrive after later manual entries still read chronologically.
export function applyMerge(dailyLog: DailyLogEntry[], adds: DayTotal[]): DailyLogEntry[] {
  const merged: DailyLogEntry[] = [
    ...dailyLog,
    ...adds.map((a) => ({ date: a.date, miles: a.miles })),
  ];
  return merged.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
