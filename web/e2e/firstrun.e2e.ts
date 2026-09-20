import { test, expect } from "@playwright/test";
import { beginMuirJourney } from "./helpers";

// AC7.2 / AC7.3: the front door. Start frames the product and the ritual, the
// picker shows the Muir card with its companion line, and the guided first run
// walks a brand-new walker to the first verbatim entry (or a preview of it),
// is skippable, and never shows again.

test("Start states the product, the ritual, and the Muir card with its companion", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "The Long Road" })).toBeVisible();
  await expect(
    page.getByText(/Each milepost you reach hands you what the traveler wrote/),
  ).toBeVisible();
  await expect(page.getByText(/log them here once a day/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: "A Thousand-Mile Walk to the Gulf" })).toBeVisible();
  await expect(page.getByText(/John Muir, a young botanist walking a thousand miles/)).toBeVisible();
});

test("the reached branch: log crosses the first milepost, then finish and reload (AC7.2)", async ({ page }) => {
  await beginMuirJourney(page);

  // The guided first run starts at the check-in.
  await expect(page.getByText("Log the miles you walked today.")).toBeVisible();

  // Log 6 miles: crosses the first Muir milepost, the Arrival opens.
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByRole("dialog").getByText(/My plan was simply to push on/)).toBeVisible();
  await page.getByRole("button", { name: "Back to the trail" }).click();

  // The finish step renders once, and Done ends the walkthrough.
  await expect(page.getByText("Return each day to earn the next entry.")).toBeVisible();
  await page.getByRole("button", { name: "Done" }).click();
  await expect(page.getByText("Return each day to earn the next entry.")).toHaveCount(0);

  // A reload boots straight to the Trail with no Start and no callout.
  await page.reload();
  await expect(page.getByLabel("Miles walked today")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Begin / })).toHaveCount(0);
  await expect(page.getByText("Return each day to earn the next entry.")).toHaveCount(0);
});

test("the preview branch: a short log previews the first entry, and Skip is permanent (AC7.3)", async ({ page }) => {
  await beginMuirJourney(page);

  // Log 2 miles: nothing crosses, so the preview step frames the next milepost.
  await page.getByLabel("Miles walked today").fill("2");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByTestId("odometer-value")).toHaveText("2");
  await expect(page.getByText("Walk this distance to earn John Muir's first entry.")).toBeVisible();

  // Skip removes the walkthrough for good, across a reload.
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText(/Walk this distance to earn/)).toHaveCount(0);

  await page.reload();
  await expect(page.getByTestId("odometer-value")).toHaveText("2");
  await expect(page.getByText(/Walk this distance to earn/)).toHaveCount(0);
});
