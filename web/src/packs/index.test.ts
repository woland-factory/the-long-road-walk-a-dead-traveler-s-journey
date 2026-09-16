import { describe, it, expect } from "vitest";
import { journeyPacks, packById } from "./index";
import { muirPack } from "./muir";

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
