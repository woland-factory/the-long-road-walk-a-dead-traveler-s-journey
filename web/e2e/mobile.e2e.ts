import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { beginMuirJourney, markWalkthroughDone } from "./helpers";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");

test.use({ viewport: { width: 390, height: 780 } });

async function horizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const el = document.scrollingElement!;
    return el.scrollWidth - el.clientWidth;
  });
}

// AC7.6: the Start screen fits 390px and its primary action is a real tap target.
test("Start fits 390px with a 44px begin button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Choose a journey" })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  const begin = page.getByRole("button", { name: "Begin this journey" });
  const box = await begin.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

// AC7.6: the walkthrough Skip control is a comfortable tap target.
test("the walkthrough Skip control is a 44px tap target", async ({ page }) => {
  await beginMuirJourney(page);
  const skip = page.getByRole("button", { name: "Skip" });
  const box = await skip.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

// AC7.6 / AC6.8: the importer fits 390px with a 44px file control.
test("the Importer fits 390px with a 44px file control", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.getByRole("button", { name: "Add miles from a file" }).click();
  await expect(page.getByRole("heading", { name: "Add miles from a file" })).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);

  const file = page.getByText("Choose a file");
  const box = await file.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);

  // Loading a CSV keeps the preview inside the viewport too.
  await page.getByLabel("Choose a file").setInputFiles(resolve(process.cwd(), "e2e/fixtures/walks.csv"));
  await expect(page.getByText(/Add 3 days, 7.5 miles/)).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

// AC8.1: no horizontal scroll at 390px on the Trail.
test("the Trail has no horizontal scroll at a 390px viewport", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

// AC8.1: the Arrival reading surface also fits 390px with no horizontal scroll.
test("the Arrival has no horizontal scroll at a 390px viewport", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);

  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
});

// AC8.2: comfortably tappable input and submit, with a labeled input.
test("check-in controls are ~44px tap targets and the input is labeled", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  const input = page.getByLabel("Miles walked today");
  const button = page.getByRole("button", { name: "Log miles" });

  await expect(input).toBeVisible(); // getByLabel proves the label association

  const inputBox = await input.boundingBox();
  const buttonBox = await button.boundingBox();
  expect(inputBox!.height).toBeGreaterThanOrEqual(44);
  expect(buttonBox!.height).toBeGreaterThanOrEqual(44);
  expect(buttonBox!.width).toBeGreaterThanOrEqual(44);
});

// AC8.3: fully operable by keyboard, with a visible focus indicator.
test("the check-in loop is operable by keyboard with a visible focus state", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);

  // Tab to the first interactive element (the mile input) and type.
  await page.keyboard.press("Tab");
  const focusedIsInput = await page.evaluate(
    () => document.activeElement?.getAttribute("name") === "miles",
  );
  expect(focusedIsInput).toBe(true);

  await page.keyboard.type("6");

  // A visible focus indicator is applied on keyboard focus.
  const outlineWidth = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    return parseFloat(getComputedStyle(el).outlineWidth || "0");
  });
  expect(outlineWidth).toBeGreaterThan(0);

  // Submit via keyboard (Enter within the form).
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  await expect(page.getByText(/My plan was simply to push on/)).toBeVisible();
});

// AC8.3: automated a11y check for contrast, labels, and landmarks.
test("passes an axe check for contrast, labels, and landmarks", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await page.addScriptTag({ path: axePath });

  const results = await page.evaluate(async () => {
    // @ts-expect-error axe is injected onto window
    return await window.axe.run(document, {
      runOnly: {
        type: "rule",
        values: ["color-contrast", "label", "region", "landmark-one-main", "page-has-heading-one"],
      },
    });
  });

  expect(results.violations).toEqual([]);
});
