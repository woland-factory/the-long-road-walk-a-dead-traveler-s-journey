import { test, expect } from "@playwright/test";
import { bootSeededDemo } from "./helpers";

// T1: the signature moment on first load. A stranger landing on staging
// (SEED_DEMO on, Muir default) meets the payoff within the first minute: a
// populated Trail, the earned verbatim words within two taps, the next entry
// visibly withheld as distance-to-the-next-words, no gamification, and a double
// journal that reads as a real facing pair.
//
// The pack is frozen (a Non-Goal to edit), so these strings are inlined
// verbatim from web/src/packs/muir.json. That makes the byte-identity of the
// earned words load-bearing: if a milepost voice ever drifts, this fails.

const M1_ID = "muir-01-louisville"; // reached (mile 6): Louisville
const EARNED_TEXT =
  "My plan was simply to push on in a general southward direction by the wildest, leafiest, and least trodden way I could find, promising the greatest extent of virgin forest.";

const NEXT_PLACE = "The Kentucky Barrens"; // withheld (mile 54)
const NEXT_APPROACH = "The trail opens onto the wide Kentucky barrens ahead.";
const WITHHELD_TEXT_FRAGMENT = "The sun was gilding the hill-tops"; // muir-03 voice, withheld

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// AC1.1: first load shows a populated Trail with no user input.
test("AC1.1 a populated Trail paints with no user input", async ({ page }) => {
  await bootSeededDemo(page);
  // The seed crosses the first two mileposts (7 + 25 = 32 miles).
  await expect(page.getByTestId("odometer-value")).toHaveText("32");
  await expect(page.getByTestId(`reached-row-${M1_ID}`)).toBeVisible();
  await expect(page.getByText(new RegExp(`miles to ${escapeRe(NEXT_PLACE)}`))).toBeVisible();
  await expect(page.getByRole("button", { name: "Read your journal" })).toBeVisible();
});

// AC1.2: the earned words are reachable in at most two taps and byte-identical.
test("AC1.2 the earned verbatim entry is two taps away and byte-identical", async ({ page }) => {
  await bootSeededDemo(page);

  // Tap a reached row: the Arrival shows the exact pack voice.
  await page.getByTestId(`reached-row-${M1_ID}`).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".arrival-voice .voice-text").first()).toHaveText(EARNED_TEXT);

  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Read your journal: the same earned entry, byte-identical, in the spread.
  await page.getByRole("button", { name: "Read your journal" }).click();
  await expect(page.locator(".spread-voice .voice-text").first()).toHaveText(EARNED_TEXT);
});

// AC1.3: the withholding is legible and airtight.
test("AC1.3 the next entry is withheld while its place and approach show", async ({ page }) => {
  await bootSeededDemo(page);

  // The withheld diary text is nowhere in the page.
  await expect(page.getByText(WITHHELD_TEXT_FRAGMENT)).toHaveCount(0);

  // Its place and authored approach line are on the next-milepost card, shown
  // as distance-to-the-next-words, not a score.
  await expect(page.getByText(new RegExp(`miles to ${escapeRe(NEXT_PLACE)}`))).toBeVisible();
  await expect(page.getByText(NEXT_APPROACH)).toBeVisible();
});

// AC1.4: not gamification. No medal/points/score/streak/level surface, and the
// progress bar names the destination place (it measures miles to the words).
test("AC1.4 no gamification surface and the progress bar names the place", async ({ page }) => {
  await bootSeededDemo(page);

  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toMatch(
    /\b(medals?|badges?|troph(y|ies)|points|scores?|streaks?|leaderboards?|levels?)\b/i,
  );

  const bar = page.getByRole("progressbar");
  await expect(bar).toHaveAttribute("aria-label", new RegExp(escapeRe(NEXT_PLACE)));
});

// AC1.5: the double journal opens on a filled facing pair.
test("AC1.5 the double journal shows a real facing pair", async ({ page }) => {
  await bootSeededDemo(page);
  await page.getByRole("button", { name: "Read your journal" }).click();

  const firstSpread = page.locator(".journal-spread").first();
  await expect(firstSpread.locator(".spread-voice .voice-text").first()).toHaveText(EARNED_TEXT);

  const walkerLine = firstSpread.locator(".spread-walker-line");
  await expect(walkerLine).toBeVisible();
  const text = (await walkerLine.textContent())?.trim() ?? "";
  expect(text.length).toBeGreaterThan(0);
});
