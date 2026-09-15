import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 390, height: 780 } });

// AC8.2: cross the first Muir milepost, write a facing line, open the journal,
// and read a full spread: the traveler's verbatim entry beside the walker's
// reached line, with the print action present and no horizontal scroll at 390px.
test("the double journal shows an earned spread beside the walker's line", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();

  // Cross the first Muir milepost (mile 6): the Arrival opens.
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  // Write the facing line, then return to the Trail.
  const line = "Six miles in the rain to start.";
  await dialog.getByLabel("Your line for this milepost").fill(line);
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // Open the journal.
  await page.getByRole("button", { name: "Read your journal" }).click();
  await expect(page.getByRole("heading", { name: "A Thousand-Mile Walk to the Gulf" })).toBeVisible();
  await expect(page.getByText("6 miles walked. 1 entry earned.")).toBeVisible();

  // One spread: the traveler's verbatim entry and the walker's side.
  await expect(page.getByRole("heading", { name: "Louisville, Kentucky" })).toBeVisible();
  await expect(page.getByText(/My plan was simply to push on/)).toBeVisible();
  await expect(page.getByText(/You reached this on/)).toBeVisible();
  await expect(page.getByText(line)).toBeVisible();

  // The primary print action is present; the close control is a real tap target.
  await expect(page.getByRole("button", { name: "Print your journal" })).toBeVisible();
  const backBox = await page.getByRole("button", { name: "Back to the trail" }).boundingBox();
  expect(backBox!.height).toBeGreaterThanOrEqual(44);

  // Mobile-first: no horizontal scroll at 390px.
  const overflow = await page.evaluate(() => {
    const el = document.scrollingElement!;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(1);

  // Back to the trail returns to the check-in.
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByLabel("Miles walked today")).toBeVisible();
});

// The withhold boundary holds in the journal: an unreached milepost has no
// spread and none of its verbatim text anywhere in the DOM.
test("the journal withholds every unreached entry", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();

  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back to the trail" }).click();

  await page.getByRole("button", { name: "Read your journal" }).click();
  await expect(page.getByText(/My plan was simply to push on/)).toBeVisible();
  // The second Muir milepost (mile 30) stays out of the journal entirely.
  await expect(page.getByRole("heading", { name: /Elizabethtown/ })).toHaveCount(0);
});
