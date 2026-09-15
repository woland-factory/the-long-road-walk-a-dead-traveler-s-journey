import { describe, it, expect } from "vitest";
import { buildJournal } from "./buildJournal";
import { fixturePack } from "../packs/fixturePack";
import { freshState, addMiles, recompute } from "../state/odometer";
import { upsertFacingLine } from "../state/personalLog";
import type { WalkerState } from "../state/types";

// T1: the pure interleave. Fixture mileposts sit at mileMark 5 (fx-1),
// 12 (fx-2), and 20 (fx-3).

const FX2_TEXT = fixturePack.mileposts[1].voices[0].text;

function walkerAt(entries: { date: string; miles: number }[]): WalkerState {
  let state = freshState(fixturePack.id, "2026-09-01T00:00:00.000Z");
  for (const e of entries) {
    state = addMiles(state, e.miles, e.date, fixturePack);
  }
  return state;
}

describe("reached-only (AC1.2)", () => {
  it("yields a spread for a reached milepost and none for an unreached one", () => {
    const state = walkerAt([{ date: "2026-09-01", miles: 6 }]); // fx-1 reached, fx-2 not
    const spreads = buildJournal(state, fixturePack);
    expect(spreads.map((s) => s.milepostId)).toEqual(["fx-1"]);
  });

  it("never carries an unreached milepost's verbatim text", () => {
    const state = walkerAt([{ date: "2026-09-01", miles: 6 }]);
    const spreads = buildJournal(state, fixturePack);
    const everything = JSON.stringify(spreads);
    expect(everything.includes(FX2_TEXT)).toBe(false);
  });
});

describe("correct from the first milepost, in order (AC1.3)", () => {
  it("cumulative 5 yields exactly the first spread", () => {
    const state = walkerAt([{ date: "2026-09-01", miles: 5 }]);
    const spreads = buildJournal(state, fixturePack);
    expect(spreads.map((s) => s.milepostId)).toEqual(["fx-1"]);
    expect(spreads.length).toBe(state.reachedMilepostIds.length);
  });

  it("cumulative 12 yields two spreads ascending by mileMark", () => {
    const state = walkerAt([
      { date: "2026-09-01", miles: 5 },
      { date: "2026-09-02", miles: 7 },
    ]);
    const spreads = buildJournal(state, fixturePack);
    expect(spreads.map((s) => s.milepostId)).toEqual(["fx-1", "fx-2"]);
    expect(spreads.map((s) => s.mileMark)).toEqual([5, 12]);
    expect(spreads.length).toBe(state.reachedMilepostIds.length);
  });

  it("yields nothing before the first milepost", () => {
    const state = walkerAt([{ date: "2026-09-01", miles: 4 }]);
    expect(buildJournal(state, fixturePack)).toEqual([]);
  });
});

describe("reachedDate attribution (AC1.4)", () => {
  it("credits each milepost to the first day whose running total reaches it", () => {
    const state = walkerAt([
      { date: "2026-09-01", miles: 3 },
      { date: "2026-09-02", miles: 3 }, // running 6: crosses fx-1 (5)
      { date: "2026-09-03", miles: 7 }, // running 13: crosses fx-2 (12)
    ]);
    const spreads = buildJournal(state, fixturePack);
    expect(spreads[0].reachedDate).toBe("2026-09-02");
    expect(spreads[1].reachedDate).toBe("2026-09-03");
    expect(spreads[0].reachedDateline).toBe("September 2, 2026");
  });

  it("two mileposts crossed by one check-in share the date and stay ordered", () => {
    const state = walkerAt([{ date: "2026-09-05", miles: 15 }]); // crosses fx-1 and fx-2
    const spreads = buildJournal(state, fixturePack);
    expect(spreads.map((s) => s.milepostId)).toEqual(["fx-1", "fx-2"]);
    expect(spreads[0].reachedDate).toBe("2026-09-05");
    expect(spreads[1].reachedDate).toBe("2026-09-05");
  });

  it("attributes every reached milepost even if derived state overshoots the log", () => {
    // A state whose reached list came from recompute against the same log:
    // the last entry is the safe fallback and the pass never leaves a gap.
    const state = recompute(walkerAt([{ date: "2026-09-06", miles: 20 }]), fixturePack);
    const spreads = buildJournal(state, fixturePack);
    expect(spreads.map((s) => s.reachedDate)).toEqual([
      "2026-09-06",
      "2026-09-06",
      "2026-09-06",
    ]);
  });
});

describe("walkerLine (AC1.5)", () => {
  it("carries the saved facing line for the milepost", () => {
    let state = walkerAt([{ date: "2026-09-01", miles: 6 }]);
    state = upsertFacingLine(state, "fx-1", "Cold river, warm sun.", "2026-09-01");
    const spreads = buildJournal(state, fixturePack);
    expect(spreads[0].walkerLine).toBe("Cold river, warm sun.");
  });

  it("is empty when the walker wrote none", () => {
    const state = walkerAt([{ date: "2026-09-01", miles: 6 }]);
    expect(buildJournal(state, fixturePack)[0].walkerLine).toBe("");
  });
});
