import { describe, it, expect } from "vitest";
import { planMerge, applyMerge } from "./mergeDays";
import type { DayTotal } from "./csv";
import type { DailyLogEntry } from "../state/types";

const TODAY = "2026-09-16";

describe("planMerge honest merge rules (AC4.3)", () => {
  it("adds new days, sorted ascending, with the rounded sum", () => {
    const days: DayTotal[] = [
      { date: "2026-06-03", miles: 2 },
      { date: "2026-06-01", miles: 1.5 },
    ];
    const plan = planMerge(days, [], TODAY);
    expect(plan.adds).toEqual([
      { date: "2026-06-01", miles: 1.5 },
      { date: "2026-06-03", miles: 2 },
    ]);
    expect(plan.addedMiles).toBe(3.5);
  });

  it("skips days already in the log, the walker's log wins", () => {
    const log: DailyLogEntry[] = [{ date: "2026-06-01", miles: 9 }];
    const days: DayTotal[] = [
      { date: "2026-06-01", miles: 2 },
      { date: "2026-06-02", miles: 3 },
    ];
    const plan = planMerge(days, log, TODAY);
    expect(plan.adds).toEqual([{ date: "2026-06-02", miles: 3 }]);
    expect(plan.skippedExisting).toBe(1);
  });

  it("skips future days, over-max days, and zero-or-less days with counts", () => {
    const days: DayTotal[] = [
      { date: "2026-12-01", miles: 3 }, // future
      { date: "2026-06-01", miles: 250 }, // over max
      { date: "2026-06-02", miles: 0 }, // empty
      { date: "2026-06-03", miles: -1 }, // empty
      { date: "2026-06-04", miles: 4 }, // added
    ];
    const plan = planMerge(days, [], TODAY);
    expect(plan.adds).toEqual([{ date: "2026-06-04", miles: 4 }]);
    expect(plan.skippedFuture).toBe(1);
    expect(plan.skippedOverMax).toBe(1);
    expect(plan.skippedEmpty).toBe(2);
  });

  it("is idempotent: re-planning against the merged log adds nothing", () => {
    const days: DayTotal[] = [
      { date: "2026-06-01", miles: 2 },
      { date: "2026-06-02", miles: 3 },
    ];
    const first = planMerge(days, [], TODAY);
    const mergedLog = applyMerge([], first.adds);
    const again = planMerge(days, mergedLog, TODAY);
    expect(again.adds).toEqual([]);
    expect(again.skippedExisting).toBe(2);
  });
});

describe("applyMerge (AC4.4)", () => {
  it("returns the union sorted ascending, stable for same-date entries", () => {
    const log: DailyLogEntry[] = [
      { date: "2026-06-05", miles: 1 },
      { date: "2026-06-05", miles: 2 }, // two manual entries same day
    ];
    const adds: DayTotal[] = [{ date: "2026-06-01", miles: 4 }];
    const merged = applyMerge(log, adds);
    expect(merged).toEqual([
      { date: "2026-06-01", miles: 4 },
      { date: "2026-06-05", miles: 1 },
      { date: "2026-06-05", miles: 2 },
    ]);
  });
});
