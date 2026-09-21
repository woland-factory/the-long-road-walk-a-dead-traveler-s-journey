import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// AC1.4: the reward is the traveler's words, never a game. No medal, badge,
// trophy, points, score, streak, or level surface exists in the product. This
// scans the user-visible strings of every component that renders a surface for
// gamification vocabulary. The rendered-DOM half of this guarantee lives in the
// signature e2e; together they keep the payoff about meaning, not points.

const root = process.cwd(); // web/

const FILES = [
  "src/trail/Trail.tsx",
  "src/trail/Odometer.tsx",
  "src/trail/NextMilepost.tsx",
  "src/trail/ReachedList.tsx",
  "src/trail/Arrival.tsx",
  "src/trail/states.tsx",
  "src/journal/Journal.tsx",
  "src/journal/Backup.tsx",
  "src/firstrun/Start.tsx",
  "src/firstrun/Walkthrough.tsx",
  "src/importer/Importer.tsx",
].map((f) => resolve(root, f));

// Extract only user-visible text (string literals and JSX text), never code.
function visibleText(file: string): string {
  const content = readFileSync(file, "utf8");
  const strings = content.match(/"[^"]*"|'[^']*'|`[^`]*`/g) ?? [];
  const jsxText = content.match(/>[^<>{}]+</g) ?? [];
  return [...strings, ...jsxText].join("\n");
}

const GAMIFICATION = [
  /\bmedals?\b/i,
  /\bbadges?\b/i,
  /\btroph(y|ies)\b/i,
  /\bpoints\b/i,
  /\bscore(s|d)?\b/i,
  /\bstreaks?\b/i,
  /\bleaderboards?\b/i,
];

describe("no gamification surface (AC1.4)", () => {
  for (const file of FILES) {
    const rel = file.replace(root, ".");
    it(`has no medal/points/score/streak vocabulary in ${rel}`, () => {
      const text = visibleText(file);
      for (const pattern of GAMIFICATION) {
        expect(pattern.test(text), `gamification term ${pattern} found`).toBe(false);
      }
    });
  }
});
