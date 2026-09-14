import { describe, it, expect } from "vitest";
import { upsertFacingLine, facingLineFor } from "./personalLog";
import { freshState } from "./odometer";
import { fixturePack } from "../packs/fixturePack";

function base() {
  return freshState(fixturePack.id, "2026-09-01T00:00:00.000Z");
}

describe("upsertFacingLine / facingLineFor (AC3.3)", () => {
  it("appends a facing line for a milepost", () => {
    const s = upsertFacingLine(base(), "fx-1", "Rain most of the way.", "2026-09-02");
    expect(facingLineFor(s, "fx-1")).toBe("Rain most of the way.");
    expect(s.personalLog).toHaveLength(1);
    expect(s.personalLog[0]).toEqual({ date: "2026-09-02", milepostId: "fx-1", text: "Rain most of the way." });
  });

  it("replaces the existing line for the same milepost (upsert, not duplicate)", () => {
    let s = upsertFacingLine(base(), "fx-1", "First line.", "2026-09-02");
    s = upsertFacingLine(s, "fx-1", "A better line.", "2026-09-03");
    expect(s.personalLog).toHaveLength(1);
    expect(facingLineFor(s, "fx-1")).toBe("A better line.");
  });

  it("keeps distinct lines for distinct mileposts", () => {
    let s = upsertFacingLine(base(), "fx-1", "One.", "2026-09-02");
    s = upsertFacingLine(s, "fx-2", "Two.", "2026-09-03");
    expect(s.personalLog).toHaveLength(2);
    expect(facingLineFor(s, "fx-1")).toBe("One.");
    expect(facingLineFor(s, "fx-2")).toBe("Two.");
  });

  it("empty text removes any stored line for that milepost", () => {
    let s = upsertFacingLine(base(), "fx-1", "A line.", "2026-09-02");
    s = upsertFacingLine(s, "fx-1", "", "2026-09-03");
    expect(s.personalLog).toHaveLength(0);
    expect(facingLineFor(s, "fx-1")).toBe("");
  });

  it("empty text on an absent milepost is a no-op", () => {
    const s = upsertFacingLine(base(), "fx-2", "", "2026-09-03");
    expect(s.personalLog).toHaveLength(0);
  });

  it("returns \"\" when no line exists", () => {
    expect(facingLineFor(base(), "fx-9")).toBe("");
  });

  it("does not mutate the input state", () => {
    const s0 = base();
    upsertFacingLine(s0, "fx-1", "A line.", "2026-09-02");
    expect(s0.personalLog).toHaveLength(0);
  });
});
