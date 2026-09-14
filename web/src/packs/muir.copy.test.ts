import { describe, it, expect } from "vitest";
import { muirPack } from "./muir";

// Copy sweep over the AUTHORED fields of the Muir pack only: pack.title,
// pack.framingNote, and every milepost.approxNote and milepost.approach. These
// are our own words and must read like a thoughtful human wrote them.
//
// PRIMARY-SOURCE EXEMPTION: voices[].text, place, and date are John Muir's
// verbatim 1867 words and factual data. They are NOT swept. His prose is full
// of em-dashes and period phrasing, and editing it would break the verbatim
// promise this product is built on. Do not "fix" Muir's punctuation.

const authored: string[] = [
  muirPack.title,
  muirPack.framingNote,
  ...muirPack.mileposts.map((m) => m.approxNote),
  ...muirPack.mileposts.map((m) => m.approach),
];

const combined = authored.join("\n");
const lower = combined.toLowerCase();

describe("Muir authored copy: no dashes (AC6.3)", () => {
  it("has no em-dash, en-dash, or ' - ' break", () => {
    expect(combined.includes("—"), "em-dash found").toBe(false);
    expect(combined.includes("–"), "en-dash found").toBe(false);
    expect(/ - /.test(combined), '" - " sentence break found').toBe(false);
  });
});

describe("Muir authored copy: no banned vocabulary (AC6.3)", () => {
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

describe("Muir authored copy: no negative empty-state phrasing (AC6.3)", () => {
  const negative = ["you don't have", "nothing here", "unable to", "something went wrong", "no results yet"];
  it("has no negative phrasing", () => {
    for (const phrase of negative) {
      expect(lower.includes(phrase), `negative phrase "${phrase}"`).toBe(false);
    }
    expect(/\bno\s+\w+\s+yet\b/.test(lower), '"No ... yet" phrasing').toBe(false);
  });
});
