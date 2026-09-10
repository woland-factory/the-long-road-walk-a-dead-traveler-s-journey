import { describe, it, expect } from "vitest";
import { addMiles, newlyReached, milesToNext, freshState } from "./odometer";
import { fixturePack } from "../packs/fixturePack";

const START = freshState(fixturePack.id, "2026-09-01T00:00:00.000Z");

describe("addMiles (AC4.1)", () => {
  it("increases cumulativeMiles by the amount and appends a dated log entry", () => {
    const next = addMiles(START, 3, "2026-09-01", fixturePack);
    expect(next.cumulativeMiles).toBe(3);
    expect(next.dailyLog).toEqual([{ date: "2026-09-01", miles: 3 }]);

    const after = addMiles(next, 4.5, "2026-09-02", fixturePack);
    expect(after.cumulativeMiles).toBe(7.5);
    expect(after.dailyLog).toHaveLength(2);
  });

  it("does not drift on repeated decimal addition", () => {
    let s = START;
    s = addMiles(s, 0.1, "2026-09-01", fixturePack);
    s = addMiles(s, 0.2, "2026-09-02", fixturePack);
    expect(s.cumulativeMiles).toBe(0.3);
  });
});

describe("reachedMilepostIds (AC4.2)", () => {
  const cases: { miles: number; reached: string[] }[] = [
    { miles: 4, reached: [] },
    { miles: 5, reached: ["fx-1"] },
    { miles: 11.99, reached: ["fx-1"] },
    { miles: 12, reached: ["fx-1", "fx-2"] },
    { miles: 20, reached: ["fx-1", "fx-2", "fx-3"] },
    { miles: 100, reached: ["fx-1", "fx-2", "fx-3"] },
  ];

  for (const { miles, reached } of cases) {
    it(`at ${miles} miles reaches exactly ${JSON.stringify(reached)}`, () => {
      const s = addMiles(START, miles, "2026-09-01", fixturePack);
      expect(s.reachedMilepostIds).toEqual(reached);
    });
  }

  it("never marks a milepost above the odometer as reached", () => {
    const s = addMiles(START, 11, "2026-09-01", fixturePack);
    expect(s.reachedMilepostIds).not.toContain("fx-2");
    expect(s.reachedMilepostIds).not.toContain("fx-3");
  });
});

describe("newlyReached", () => {
  it("returns only the ids crossed by this submit", () => {
    const before = addMiles(START, 4, "2026-09-01", fixturePack);
    const after = addMiles(before, 8, "2026-09-02", fixturePack); // 12 total
    expect(newlyReached(before, after)).toEqual(["fx-1", "fx-2"]);
  });

  it("returns empty when no new milepost is crossed", () => {
    const before = addMiles(START, 6, "2026-09-01", fixturePack);
    const after = addMiles(before, 1, "2026-09-02", fixturePack); // 7 total
    expect(newlyReached(before, after)).toEqual([]);
  });
});

describe("milesToNext (AC4.3)", () => {
  it("returns distance to the nearest unreached milepost", () => {
    expect(milesToNext(START, fixturePack)).toBe(5);
    const s = addMiles(START, 5, "2026-09-01", fixturePack);
    expect(milesToNext(s, fixturePack)).toBe(7); // 12 - 5
  });

  it("returns null once every milepost is reached", () => {
    const s = addMiles(START, 20, "2026-09-01", fixturePack);
    expect(milesToNext(s, fixturePack)).toBeNull();
  });
});
