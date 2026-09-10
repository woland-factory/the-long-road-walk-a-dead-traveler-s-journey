import { test, expect } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const axePath = require.resolve("axe-core");

test.use({ viewport: { width: 390, height: 780 } });

// AC8.1: no horizontal scroll at 390px.
test("has no horizontal scroll at a 390px viewport", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement!;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1); // allow sub-pixel rounding
});

// AC8.2: comfortably tappable input and submit, with a labeled input.
test("check-in controls are ~44px tap targets and the input is labeled", async ({ page }) => {
  await page.goto("/");
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
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();

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
  await expect(page.getByText(/We crossed the river at dawn/)).toBeVisible();
});

// AC8.3: automated a11y check for contrast, labels, and landmarks.
test("passes an axe check for contrast, labels, and landmarks", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();
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
