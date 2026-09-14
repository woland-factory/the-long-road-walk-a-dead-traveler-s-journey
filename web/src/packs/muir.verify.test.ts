import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanSource, normalizeExcerpt, NARRATIVE_START, GUTENBERG_END_MARKER } from "./verifySource";
import { muirPack } from "./muir";

// The heart of this EPIC: prove every earned line is John Muir's verbatim words,
// keyed to real ground, against the committed Project Gutenberg #60749 source.
// The source is read only here via fs and is never imported by app code.

const SOURCE_PATH = resolve(process.cwd(), "src/packs/sources/gutenberg-60749.txt");

let raw = "";
let clean = "";

beforeAll(() => {
  raw = readFileSync(SOURCE_PATH, "utf8");
  clean = cleanSource(raw);
});

describe("AC3.1 committed source and narrative window", () => {
  it("contains the narrative-start and Gutenberg-end markers", () => {
    expect(raw.includes(NARRATIVE_START)).toBe(true);
    expect(raw.includes(GUTENBERG_END_MARKER)).toBe(true);
  });
  it("cleanSource returns a substantial narrative body", () => {
    expect(clean.length).toBeGreaterThan(10000);
    // Apparatus is stripped from the cleaned body.
    expect(clean.includes("_")).toBe(false);
    expect(clean.includes("[")).toBe(false);
    expect(clean.includes("]")).toBe(false);
  });
});

describe("V1 verbatim (AC3.2)", () => {
  it("finds every voice text verbatim in the cleaned source", () => {
    for (const m of muirPack.mileposts) {
      for (const v of m.voices) {
        const excerpt = normalizeExcerpt(v.text);
        expect(clean.includes(excerpt), `milepost "${m.id}" voice not verbatim in source`).toBe(true);
      }
    }
  });
});

describe("V2 no apparatus in the pack (AC3.3)", () => {
  it("no voice text contains [, ], or _", () => {
    for (const m of muirPack.mileposts) {
      for (const v of m.voices) {
        expect(/[[\]_]/.test(v.text), `milepost "${m.id}" voice carries apparatus`).toBe(false);
      }
    }
  });
});

describe("V3 non-trivial excerpts (AC3.3)", () => {
  it("every voice is a substantial passage with a sentence", () => {
    for (const m of muirPack.mileposts) {
      for (const v of m.voices) {
        expect(v.text.length, `milepost "${m.id}" voice too short`).toBeGreaterThanOrEqual(40);
        expect(/[.!?]/.test(v.text), `milepost "${m.id}" voice has no sentence end`).toBe(true);
      }
    }
  });
});

describe("V4 dates ordered and in the journey year (AC3.4)", () => {
  const mp = muirPack.mileposts;
  it("every date matches YYYY-MM-DD, is a real 1867 date", () => {
    for (const m of mp) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(m.date), `milepost "${m.id}" bad date format`).toBe(true);
      const [y, mo, d] = m.date.split("-").map(Number);
      expect(y).toBe(1867);
      const dt = new Date(Date.UTC(y, mo - 1, d));
      expect(dt.getUTCFullYear()).toBe(y);
      expect(dt.getUTCMonth()).toBe(mo - 1);
      expect(dt.getUTCDate()).toBe(d);
    }
  });
  it("dates are non-decreasing", () => {
    for (let i = 1; i < mp.length; i++) {
      expect(mp[i].date >= mp[i - 1].date, `date decreased at "${mp[i].id}"`).toBe(true);
    }
  });
});

describe("V5 miles strictly monotonic (AC3.4)", () => {
  const mp = muirPack.mileposts;
  it("mileMark is strictly increasing and within (0, totalMiles]", () => {
    for (const m of mp) {
      expect(Number.isFinite(m.mileMark)).toBe(true);
      expect(m.mileMark).toBeGreaterThan(0);
      expect(m.mileMark).toBeLessThanOrEqual(muirPack.totalMiles);
    }
    for (let i = 1; i < mp.length; i++) {
      expect(mp[i].mileMark > mp[i - 1].mileMark, `mileMark not increasing at "${mp[i].id}"`).toBe(true);
    }
  });
});

describe("V6 count (AC3.5)", () => {
  it("has at least 30 mileposts", () => {
    expect(muirPack.mileposts.length).toBeGreaterThanOrEqual(30);
  });
});

describe("V7 spread across the route (AC3.5)", () => {
  const mp = muirPack.mileposts;
  it("first mark <= 50, last mark >= 0.9 * totalMiles, no gap > 50", () => {
    expect(mp[0].mileMark).toBeLessThanOrEqual(50);
    expect(mp[mp.length - 1].mileMark).toBeGreaterThanOrEqual(0.9 * muirPack.totalMiles);
    for (let i = 1; i < mp.length; i++) {
      expect(mp[i].mileMark - mp[i - 1].mileMark, `gap too large before "${mp[i].id}"`).toBeLessThanOrEqual(50);
    }
  });
});

describe("AC3.6 source is not importable app code", () => {
  it("no built bundle sentinel: the source file itself is read only via fs here", () => {
    // A sentence from the editor's introduction, outside every packed excerpt.
    // bundle.e2e.ts greps this same sentinel against the built dist to prove
    // the source stays out of the client bundle.
    const introSentinel = "These words are written on the";
    expect(raw.includes(introSentinel)).toBe(true);
    for (const m of muirPack.mileposts) {
      for (const v of m.voices) {
        expect(v.text.includes(introSentinel)).toBe(false);
      }
    }
  });
});
