import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Mechanical copy sweep over every source that carries user-visible strings.
// This is the automated form of the required pre-ship sweep.

const root = process.cwd(); // web/
const repoRoot = resolve(root, "..");

const FILES: string[] = [
  resolve(root, "index.html"),
  resolve(root, "src/trail/Trail.tsx"),
  resolve(root, "src/trail/CheckIn.tsx"),
  resolve(root, "src/trail/Odometer.tsx"),
  resolve(root, "src/trail/NextMilepost.tsx"),
  resolve(root, "src/trail/ReachedList.tsx"),
  resolve(root, "src/trail/Arrival.tsx"),
  resolve(root, "src/trail/facingLine.ts"),
  resolve(root, "src/trail/states.tsx"),
  resolve(root, "src/trail/validate.ts"),
  resolve(root, "src/ErrorBoundary.tsx"),
  resolve(root, "src/packs/fixturePack.ts"),
  resolve(repoRoot, "README.md"),
  resolve(repoRoot, ".env.example"),
];

// For source files, scan only user-visible text (string literals and JSX text
// nodes), never code such as arithmetic or identifiers. Prose files (README,
// .env.example, HTML) are scanned whole.
function read(file: string): string {
  const content = readFileSync(file, "utf8");
  if (file.endsWith(".ts") || file.endsWith(".tsx")) {
    const strings = content.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? [];
    const jsxText = content.match(/>[^<>{}]+</g) ?? [];
    return [...strings, ...jsxText].join("\n");
  }
  return content;
}

describe("copy sweep: no dashes (AC11.1)", () => {
  for (const file of FILES) {
    it(`has no em/en dash or " - " break in ${file.replace(repoRoot, ".")}`, () => {
      const text = read(file);
      expect(text.includes("—"), "em-dash found").toBe(false);
      expect(text.includes("–"), "en-dash found").toBe(false);
      expect(/ - /.test(text), '" - " sentence break found').toBe(false);
    });
  }
});

describe("copy sweep: no banned vocabulary (AC11.2)", () => {
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
  for (const file of FILES) {
    it(`has none of the banned words in ${file.replace(repoRoot, ".")}`, () => {
      const text = read(file).toLowerCase();
      for (const word of banned) {
        expect(text.includes(word), `banned word "${word}"`).toBe(false);
      }
    });
  }
});

describe("copy sweep: no negative empty-state phrasing (AC11.3)", () => {
  const negative = [
    "you don't have",
    "nothing here",
    "unable to",
    "something went wrong",
    "no results yet",
  ];
  for (const file of FILES) {
    it(`has no negative phrasing in ${file.replace(repoRoot, ".")}`, () => {
      const text = read(file).toLowerCase();
      for (const phrase of negative) {
        expect(text.includes(phrase), `negative phrase "${phrase}"`).toBe(false);
      }
      // "No <thing> yet" pattern.
      expect(/\bno\s+\w+\s+yet\b/.test(text), '"No ... yet" phrasing').toBe(false);
    });
  }
});
