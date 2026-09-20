import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanSource, normalizeExcerpt, LC_NARRATIVE_START, GUTENBERG_END_MARKER } from "./verifySource";
import { lewisClarkPack } from "./lewisclark";

// The heart of this EPIC: prove every earned line is the keepers' verbatim words,
// keyed to real ground, against the committed Project Gutenberg #8419 source.
// The source is read only here via fs and is never imported by app code.

const SOURCE_PATH = resolve(process.cwd(), "src/packs/sources/gutenberg-8419.txt");

let raw = "";
let clean = "";

beforeAll(() => {
  raw = readFileSync(SOURCE_PATH, "utf8");
  clean = cleanSource(raw, LC_NARRATIVE_START);
});

describe("T1 committed source and narrative window (AC1.1, AC2.2, AC2.3)", () => {
  it("contains the Gutenberg end marker and the 1804 keeper headers", () => {
    expect(raw.includes(GUTENBERG_END_MARKER)).toBe(true);
    expect(/\[Clark, May 14, 1804\]/.test(raw)).toBe(true);
    expect(/\[Lewis, /.test(raw)).toBe(true);
    expect(/\[Ordway, May 17, 1804\]/.test(raw)).toBe(true);
    expect(raw.includes("Fort Mandan")).toBe(true);
  });
  it("LC_NARRATIVE_START occurs exactly once (AC2.3)", () => {
    const first = raw.indexOf(LC_NARRATIVE_START);
    expect(first).toBeGreaterThan(-1);
    expect(raw.indexOf(LC_NARRATIVE_START, first + 1)).toBe(-1);
  });
  it("cleanSource returns a substantial body with no apparatus (AC2.2)", () => {
    expect(clean.length).toBeGreaterThan(10000);
    expect(clean.includes("_")).toBe(false);
    expect(clean.includes("[")).toBe(false);
    expect(clean.includes("]")).toBe(false);
  });
});

describe("AC4.1 verbatim", () => {
  it("finds every voice text verbatim in the cleaned source", () => {
    for (const m of lewisClarkPack.mileposts) {
      for (const v of m.voices) {
        const excerpt = normalizeExcerpt(v.text);
        expect(clean.includes(excerpt), `milepost "${m.id}" voice by ${v.author} not verbatim in source`).toBe(true);
      }
    }
  });
});

describe("AC4.2 no apparatus in the pack", () => {
  it("no voice text contains [, ], or _", () => {
    for (const m of lewisClarkPack.mileposts) {
      for (const v of m.voices) {
        expect(/[[\]_]/.test(v.text), `milepost "${m.id}" voice carries apparatus`).toBe(false);
      }
    }
  });
});

describe("AC4.3 substantial excerpts", () => {
  it("every voice is at least 40 chars with a sentence-ending mark", () => {
    for (const m of lewisClarkPack.mileposts) {
      for (const v of m.voices) {
        expect(v.text.length, `milepost "${m.id}" voice too short`).toBeGreaterThanOrEqual(40);
        expect(/[.!?]/.test(v.text), `milepost "${m.id}" voice has no sentence end`).toBe(true);
      }
    }
  });
});

describe("AC4.4 dates ordered and in the segment window", () => {
  const mp = lewisClarkPack.mileposts;
  it("every date matches YYYY-MM-DD, is a real 1804 date in months 05-11", () => {
    for (const m of mp) {
      expect(/^\d{4}-\d{2}-\d{2}$/.test(m.date), `milepost "${m.id}" bad date format`).toBe(true);
      const [y, mo, d] = m.date.split("-").map(Number);
      expect(y).toBe(1804);
      expect(mo).toBeGreaterThanOrEqual(5);
      expect(mo).toBeLessThanOrEqual(11);
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

describe("AC4.5 miles strictly monotonic", () => {
  const mp = lewisClarkPack.mileposts;
  it("mileMark is strictly increasing and within (0, totalMiles]", () => {
    for (const m of mp) {
      expect(Number.isFinite(m.mileMark)).toBe(true);
      expect(m.mileMark).toBeGreaterThan(0);
      expect(m.mileMark).toBeLessThanOrEqual(lewisClarkPack.totalMiles);
    }
    for (let i = 1; i < mp.length; i++) {
      expect(mp[i].mileMark > mp[i - 1].mileMark, `mileMark not increasing at "${mp[i].id}"`).toBe(true);
    }
  });
});

describe("AC4.6 count", () => {
  it("has at least 40 mileposts", () => {
    expect(lewisClarkPack.mileposts.length).toBeGreaterThanOrEqual(40);
  });
});

describe("AC4.7 spread across the route", () => {
  const mp = lewisClarkPack.mileposts;
  it("first mark <= 60, last mark >= 0.9 * totalMiles, no gap > 90", () => {
    expect(mp[0].mileMark).toBeLessThanOrEqual(60);
    expect(mp[mp.length - 1].mileMark).toBeGreaterThanOrEqual(0.9 * lewisClarkPack.totalMiles);
    for (let i = 1; i < mp.length; i++) {
      expect(mp[i].mileMark - mp[i - 1].mileMark, `gap too large before "${mp[i].id}"`).toBeLessThanOrEqual(90);
    }
  });
});

describe("AC4.8 multi-voice mileposts", () => {
  const mp = lewisClarkPack.mileposts;
  it("at least 8 mileposts carry two or more distinct keepers", () => {
    const multi = mp.filter((m) => new Set(m.voices.map((v) => v.author)).size >= 2);
    expect(multi.length).toBeGreaterThanOrEqual(8);
  });
  it("at least 3 distinct journalist authors appear across the pack", () => {
    const authors = new Set<string>();
    for (const m of mp) for (const v of m.voices) authors.add(v.author);
    expect(authors.size).toBeGreaterThanOrEqual(3);
  });
  it("a multi-voice milepost sits early in the segment (low mileMark)", () => {
    const earlyMulti = mp.some(
      (m) => m.mileMark <= 60 && new Set(m.voices.map((v) => v.author)).size >= 2,
    );
    expect(earlyMulti).toBe(true);
  });
});

describe("AC4.9 Fort Mandan end", () => {
  const mp = lewisClarkPack.mileposts;
  it("the last milepost is Fort Mandan and holds the highest mileMark", () => {
    const last = mp[mp.length - 1];
    expect(/Fort Mandan/i.test(last.place)).toBe(true);
    const maxMile = Math.max(...mp.map((m) => m.mileMark));
    expect(last.mileMark).toBe(maxMile);
  });
});

describe("AC4.10 approach lines are authored, not verbatim source", () => {
  it("no approach line is found in the cleaned source, and each is 15 to 120 chars", () => {
    for (const m of lewisClarkPack.mileposts) {
      const excerpt = normalizeExcerpt(m.approach);
      expect(clean.includes(excerpt), `milepost "${m.id}" approach is a verbatim source slice`).toBe(false);
      expect(m.approach.length, `milepost "${m.id}" approach too short`).toBeGreaterThanOrEqual(15);
      expect(m.approach.length, `milepost "${m.id}" approach too long`).toBeLessThanOrEqual(120);
    }
  });
});

describe("AC8.2 packed excerpts are entry bodies, not front matter", () => {
  it("the #8419 front-matter sentinel is in the raw file but no packed voice", () => {
    // A credits line from #8419's front matter, outside every packed excerpt.
    // bundle.e2e.ts greps this same sentinel against dist to prove the source
    // stays out of the client bundle.
    const sentinel = "Produced by Bob Webster and David Widger";
    expect(raw.includes(sentinel)).toBe(true);
    for (const m of lewisClarkPack.mileposts) {
      for (const v of m.voices) {
        expect(v.text.includes(sentinel)).toBe(false);
      }
    }
  });
});
