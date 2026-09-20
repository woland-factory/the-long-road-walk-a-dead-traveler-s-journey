import { describe, it, expect } from "vitest";
import { journeyPacks, packById } from "./index";
import { muirPack } from "./muir";
import { lewisClarkPack } from "./lewisclark";

// AC1.1: the registry holds the Muir pack and packById looks it up.
describe("pack registry (AC1.1)", () => {
  it("journeyPacks contains the Muir pack", () => {
    expect(journeyPacks).toContain(muirPack);
  });

  it("packById returns the pack for a known id", () => {
    expect(packById("muir-thousand-mile-walk")).toBe(muirPack);
  });

  it("packById returns undefined for an unknown id", () => {
    expect(packById("no-such-pack")).toBeUndefined();
  });
});

// AC5.2: the Lewis & Clark pack is registered and resolvable, Muir stays first.
describe("Lewis & Clark registration (AC5.2)", () => {
  it("journeyPacks contains the Lewis & Clark pack", () => {
    expect(journeyPacks).toContain(lewisClarkPack);
  });

  it("packById resolves the Lewis & Clark id", () => {
    expect(packById("lewis-clark-1804-fort-mandan")).toBe(lewisClarkPack);
  });

  it("keeps Muir first so it stays the boot-gate and SEED_DEMO default", () => {
    expect(journeyPacks[0]).toBe(muirPack);
  });
});
