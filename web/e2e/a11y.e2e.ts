import { test, expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { beginMuirJourney, beginLewisClarkJourney, markWalkthroughDone } from "./helpers";

// T4: the accessibility pass extended beyond the Trail. The same axe rule set
// runs on every surface, and keyboard reach is locked on the Journal and the
// Arrival.

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");
const RULES = ["color-contrast", "label", "region", "landmark-one-main", "page-has-heading-one"];

async function axeViolations(page: Page): Promise<unknown[]> {
  await page.addScriptTag({ path: axePath });
  return page.evaluate(async (rules) => {
    // @ts-expect-error axe is injected onto window
    const results = await window.axe.run(document, { runOnly: { type: "rule", values: rules } });
    return results.violations;
  }, RULES);
}

// AC4.1: axe on the Start screen.
test("AC4.1 the Start screen passes axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Choose a journey" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

// AC4.1: axe on the Importer, both the choose and preview phases.
test("AC4.1 the Importer passes axe in choose and preview", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.getByRole("button", { name: "Add miles from a file" }).click();
  await expect(page.getByRole("heading", { name: "Add miles from a file" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);

  await page.getByLabel("Choose a file").setInputFiles(resolve(process.cwd(), "e2e/fixtures/walks.csv"));
  await expect(page.getByText(/Add 3 days, 7.5 miles/)).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

// AC4.1: axe on the single-voice Arrival dialog.
test("AC4.1 the single-voice Arrival passes axe", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

// AC4.1: axe on the multi-voice Arrival dialog (Lewis & Clark).
test("AC4.1 the multi-voice Arrival passes axe", async ({ page }) => {
  await beginLewisClarkJourney(page);
  await page.getByLabel("Miles walked today").fill("15");
  await page.getByRole("button", { name: "Log miles" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Next entry" }).click();
  await expect(dialog.getByRole("heading", { name: "near Mr. Piper's Landing" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

// AC4.1: axe on the double Journal.
test("AC4.1 the double Journal passes axe", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await page.getByRole("button", { name: "Read your journal" }).click();
  await expect(page.getByRole("heading", { name: "A Thousand-Mile Walk to the Gulf" })).toBeVisible();
  expect(await axeViolations(page)).toEqual([]);
});

// AC4.2: keyboard reach for the Journal. Escape returns to the Trail and
// restores focus to the control that opened it.
test("AC4.2 the Journal opens and Escape returns focus to the opener", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await page.getByRole("button", { name: "Back to the trail" }).click();

  const opener = page.getByRole("button", { name: "Read your journal" });
  await opener.focus();
  await opener.press("Enter");
  await expect(page.getByRole("heading", { name: "A Thousand-Mile Walk to the Gulf" })).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.getByLabel("Miles walked today")).toBeVisible();
  const focusedText = await page.evaluate(() => document.activeElement?.textContent ?? "");
  expect(focusedText).toContain("Read your journal");
});

// AC4.2: keyboard reach for the Arrival. Focus enters the dialog, Escape saves
// the facing line and closes, and reopening proves the save.
test("AC4.2 the Arrival traps focus and Escape saves and closes", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Focus is inside the dialog when it opens.
  const focusInside = await page.evaluate(
    () => document.querySelector(".arrival-dialog")?.contains(document.activeElement) ?? false,
  );
  expect(focusInside).toBe(true);

  // Type a facing line, then Escape saves and closes.
  await dialog.getByLabel("Your line for this milepost").fill("Kept a steady pace all morning.");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Reopening the reached row shows the saved line: Escape saved it.
  await page.getByTestId("reached-row-muir-01-louisville").click();
  await expect(page.getByRole("dialog").getByLabel("Your line for this milepost")).toHaveValue(
    "Kept a steady pace all morning.",
  );
});
