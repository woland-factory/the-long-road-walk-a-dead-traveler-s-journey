import { describe, it, expect } from "vitest";
import { lewisClarkPack } from "./lewisclark";

// Copy sweep over the AUTHORED fields of the Lewis & Clark pack only: pack.title,
// pack.framingNote, pack.companion, and every milepost.approxNote and
// milepost.approach. These are our own words and must read like a thoughtful
// human wrote them.
//
// PRIMARY-SOURCE EXEMPTION: voices[].text, place, and date are the keepers'
// verbatim 1804 words and factual data. They are NOT swept. Their prose is full
// of period spelling and punctuation, and editing it would break the verbatim
// promise this product is built on. Do not "fix" the keepers' 1804 spelling.

const authored: string[] = [
  lewisClarkPack.title,
  lewisClarkPack.framingNote,
  lewisClarkPack.companion,
  ...lewisClarkPack.mileposts.map((m) => m.approxNote),
  ...lewisClarkPack.mileposts.map((m) => m.approach),
];

const combined = authored.join("\n");
const lower = combined.toLowerCase();

describe("Lewis & Clark authored copy: no dashes", () => {
  it("has no em-dash, en-dash, or ' - ' break", () => {
    expect(combined.includes("—"), "em-dash found").toBe(false);
    expect(combined.includes("–"), "en-dash found").toBe(false);
    expect(/ - /.test(combined), '" - " sentence break found').toBe(false);
  });
});

describe("Lewis & Clark authored copy: no banned vocabulary", () => {
  const banned = [
    "seamlessly",
    "effortlessly",
    "elevate",
    "empower",
    "leverage",
    "robust",
    "dive in",
    "fast-paced",
    "we've got you covered",
    "unlock your",
  ];
  it("has none of the banned words", () => {
    for (const word of banned) {
      expect(lower.includes(word), `banned word "${word}"`).toBe(false);
    }
  });
});

describe("Lewis & Clark authored copy: no negative empty-state phrasing", () => {
  const negative = ["you don't have", "nothing here", "unable to", "something went wrong", "no results yet"];
  it("has no negative phrasing", () => {
    for (const phrase of negative) {
      expect(lower.includes(phrase), `negative phrase "${phrase}"`).toBe(false);
    }
    expect(/\bno\s+\w+\s+yet\b/.test(lower), '"No ... yet" phrasing').toBe(false);
  });
});

describe("Lewis & Clark chapter honesty and framing (AC3.8, AC3.9)", () => {
  it("companion names the keepers and frames the Fort Mandan chapter", () => {
    expect(lewisClarkPack.companion).toMatch(/Lewis/);
    expect(lewisClarkPack.companion).toMatch(/Clark/);
    expect(lewisClarkPack.companion.toLowerCase()).toContain("first chapter");
    expect(lewisClarkPack.companion).toMatch(/Fort Mandan/);
  });
  it("title and companion together make the chapter and its end explicit", () => {
    expect(`${lewisClarkPack.title} ${lewisClarkPack.companion}`).toMatch(/Fort Mandan/);
  });
  it("framingNote addresses the 1804 period content and states it is unedited", () => {
    expect(lewisClarkPack.framingNote).toMatch(/1804/);
    expect(lewisClarkPack.framingNote.toLowerCase()).toContain("native");
    expect(lewisClarkPack.framingNote.toLowerCase()).toMatch(/do not (soften|change)/);
  });
});
