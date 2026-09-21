import { describe, it, expect } from "vitest";
import { muirPack } from "../packs/muir";
import { recompute, freshState } from "./odometer";
import { buildJournal } from "../journal/buildJournal";
import type { WalkerState } from "./types";

// AC2.4 / AC2.5: months of daily walking must not slow the hot paths. The daily
// log is summed and scanned, never listed, so recompute and buildJournal stay
// cheap and the rendered surfaces are bounded by the pack's milepost count, not
// by the number of logged days.

// A walker with one entry per day for well over a year. Three miles a day for
// 400 days is 1200 miles, past the last Muir milepost, so every milepost is
// reached: the widest journal this pack can produce.
function walkerWithDays(days: number): WalkerState {
  const base = freshState(muirPack.id, "2026-01-01T00:00:00.000Z");
  const dailyLog = Array.from({ length: days }, (_, i) => {
    const day = 1 + (i % 27);
    const month = 1 + (Math.floor(i / 27) % 12);
    return { date: `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, miles: 3 };
  });
  return recompute({ ...base, dailyLog }, muirPack);
}

describe("hot paths stay fast as daily entries accumulate (AC2.4)", () => {
  const state = walkerWithDays(400);

  it("has 400 logged days", () => {
    expect(state.dailyLog.length).toBe(400);
  });

  it("recompute runs well under budget at 400 entries", () => {
    const runs = 50;
    const start = performance.now();
    for (let i = 0; i < runs; i += 1) recompute(state, muirPack);
    const perRun = (performance.now() - start) / runs;
    // A few milliseconds each is the budget; assert generously so a loaded CI
    // host stays green while a real regression (O(days^2)) still trips it.
    expect(perRun).toBeLessThan(20);
  });

  it("buildJournal runs well under budget at 400 entries", () => {
    const runs = 50;
    const start = performance.now();
    for (let i = 0; i < runs; i += 1) buildJournal(state, muirPack);
    const perRun = (performance.now() - start) / runs;
    expect(perRun).toBeLessThan(20);
  });
});

describe("rendered work is bounded by mileposts, not by logged days (AC2.4)", () => {
  it("buildJournal produces one spread per reached milepost, never one per day", () => {
    const state = walkerWithDays(400);
    const spreads = buildJournal(state, muirPack);
    // Every milepost reached (1200 miles > 1000), so spreads == milepost count.
    expect(spreads.length).toBe(muirPack.mileposts.length);
    // The bound that matters: far fewer spreads than logged days.
    expect(spreads.length).toBeLessThan(state.dailyLog.length);
    expect(spreads.length).toBeLessThanOrEqual(muirPack.mileposts.length);
  });

  it("reached ids are bounded by the pack, so the reached rows are too", () => {
    const state = walkerWithDays(400);
    expect(state.reachedMilepostIds.length).toBeLessThanOrEqual(muirPack.mileposts.length);
    expect(state.reachedMilepostIds.length).toBeLessThan(state.dailyLog.length);
  });
});
