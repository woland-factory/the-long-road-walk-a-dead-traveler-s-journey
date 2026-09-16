import { describe, it, expect } from "vitest";
import { walkthroughStep, type WalkthroughStep } from "./walkthrough";

// AC3.1: the decision table, exhaustively over every input combination.
describe("walkthroughStep decision table (AC3.1)", () => {
  const bools = [false, true];
  for (const done of bools)
    for (const hasMiles of bools)
      for (const hasEarned of bools)
        for (const arrivalOpen of bools)
          for (const previewSeen of bools) {
            const args = { done, hasMiles, hasEarned, arrivalOpen, previewSeen };
            let expected: WalkthroughStep;
            if (done) expected = null;
            else if (arrivalOpen) expected = null;
            else if (!hasMiles) expected = "log";
            else if (hasEarned) expected = "finish";
            else if (!previewSeen) expected = "preview";
            else expected = "finish";
            it(`${JSON.stringify(args)} -> ${expected}`, () => {
              expect(walkthroughStep(args)).toBe(expected);
            });
          }
});
