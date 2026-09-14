import { describe, it, expect } from "vitest";
import { validatePack } from "./validatePack";
import { fixturePack } from "./fixturePack";
import { muirPack } from "./muir";
import type { JourneyPack } from "./types";

// Deep clone so a broken-input mutation never leaks into another test.
function clone(pack: JourneyPack): JourneyPack {
  return JSON.parse(JSON.stringify(pack)) as JourneyPack;
}

describe("validatePack accepts valid packs (AC2.1)", () => {
  it("returns [] for the Muir pack", () => {
    expect(validatePack(muirPack)).toEqual([]);
  });
  it("returns [] for the fixture pack", () => {
    expect(validatePack(fixturePack)).toEqual([]);
  });
});

describe("validatePack catches each rule (AC2.2)", () => {
  it("flags a repeated mileMark", () => {
    const p = clone(fixturePack);
    p.mileposts[1].mileMark = p.mileposts[0].mileMark;
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S6"))).toBe(true);
  });

  it("flags a backward date", () => {
    const p = clone(fixturePack);
    p.mileposts[2].date = "2000-01-01";
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S7"))).toBe(true);
  });

  it("flags an approxNote missing 'near this ground'", () => {
    const p = clone(fixturePack);
    p.mileposts[0].approxNote = "somewhere over there";
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S8"))).toBe(true);
  });

  it("flags an approxNote carrying a coordinate", () => {
    const p = clone(fixturePack);
    p.mileposts[0].approxNote = "near this ground at 38.25, -85.76";
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S8"))).toBe(true);
  });

  it("flags an approxNote carrying a lat token", () => {
    const p = clone(fixturePack);
    p.mileposts[0].approxNote = "near this ground, lat given below";
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S8"))).toBe(true);
  });

  it("flags an empty voices array", () => {
    const p = clone(fixturePack);
    p.mileposts[0].voices = [];
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S5"))).toBe(true);
  });

  it("flags a duplicate milepost id", () => {
    const p = clone(fixturePack);
    p.mileposts[1].id = p.mileposts[0].id;
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S4"))).toBe(true);
  });

  it("flags a missing framing note", () => {
    const p = clone(fixturePack);
    p.framingNote = "";
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S3"))).toBe(true);
  });

  it("flags a non-positive totalMiles", () => {
    const p = clone(fixturePack);
    p.totalMiles = 0;
    const errs = validatePack(p);
    expect(errs.some((e) => e.startsWith("S1"))).toBe(true);
  });
});
