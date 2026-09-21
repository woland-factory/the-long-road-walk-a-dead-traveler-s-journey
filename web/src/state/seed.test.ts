import { describe, it, expect } from "vitest";
import { muirPack } from "../packs/muir";
import { lewisClarkPack } from "../packs/lewisclark";
import { buildSeededState } from "./seed";
import { buildJournal } from "../journal/buildJournal";
import { facingLineFor } from "./personalLog";

// AC1.5: the seeded demo shows a filled facing pair, not a half-empty spread.
// The seed crosses the first two mileposts and fills the first reached
// milepost's own walker line, so the staging double journal opens on a real
// pair: the traveler's verbatim entry beside a walker note.

describe("the seeded demo is a filled facing pair (AC1.5)", () => {
  it("crosses the first two Muir mileposts and withholds the third", () => {
    const state = buildSeededState(muirPack);
    expect(state.reachedMilepostIds).toContain(muirPack.mileposts[0].id);
    expect(state.reachedMilepostIds).toContain(muirPack.mileposts[1].id);
    expect(state.reachedMilepostIds).not.toContain(muirPack.mileposts[2].id);
  });

  it("seeds a walker line on the first reached milepost", () => {
    const state = buildSeededState(muirPack);
    const first = muirPack.mileposts[0];
    const line = facingLineFor(state, first.id);
    expect(line.length).toBeGreaterThan(0);
  });

  it("makes the first journal spread show both the traveler voice and the walker line", () => {
    const state = buildSeededState(muirPack);
    const spreads = buildJournal(state, muirPack);
    const first = spreads[0];
    expect(first.voices.length).toBeGreaterThan(0);
    expect(first.voices[0].text.length).toBeGreaterThan(0);
    expect(first.walkerLine.length).toBeGreaterThan(0);
  });

  it("also fills a facing pair for the Lewis & Clark pack", () => {
    const state = buildSeededState(lewisClarkPack);
    const spreads = buildJournal(state, lewisClarkPack);
    expect(spreads.length).toBeGreaterThanOrEqual(1);
    expect(spreads[0].walkerLine.length).toBeGreaterThan(0);
    expect(spreads[0].voices.length).toBeGreaterThan(0);
  });
});
