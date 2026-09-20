import { test, expect } from "@playwright/test";
import { beginLewisClarkJourney } from "./helpers";

// AC7.3: from a fresh app, begin the Lewis & Clark journey from the picker, let
// the guided walkthrough fire, log enough miles to reach an early multi-voice
// milepost, open the Arrival, and read two keepers' entries side by side.
test("begin Lewis & Clark, reach a multi-voice milepost, and see two keepers", async ({ page }) => {
  await beginLewisClarkJourney(page);

  // The guided first run fires for this journey too (it anchors to controls,
  // not to a pack).
  await expect(page.getByText("Log the miles you walked today.")).toBeVisible();

  // 15 miles crosses the first two mileposts. The second (near Mr. Piper's
  // Landing) carries both Lewis and Clark on the same day.
  await page.getByLabel("Miles walked today").fill("15");
  await page.getByRole("button", { name: "Log miles" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // The queue opens at the start, Camp River Dubois, a single Clark voice.
  await expect(dialog.getByRole("heading", { name: "Camp River Dubois, the start" })).toBeVisible();

  // Advance to the multi-voice milepost.
  await page.getByRole("button", { name: "Next entry" }).click();
  await expect(dialog.getByRole("heading", { name: "near Mr. Piper's Landing" })).toBeVisible();

  // Both keepers' verbatim entries are present, each attributed to its keeper.
  await expect(dialog.getByText(/some wild gees with their young brudes/)).toBeVisible();
  await expect(dialog.getByText(/at 9 oClock Set out and proceeded on 9 miles/)).toBeVisible();
  await expect(dialog.getByText("Meriwether Lewis")).toBeVisible();
  await expect(dialog.getByText("William Clark")).toBeVisible();

  // Two distinct voice passages render in this one milepost's ceremony.
  await expect(dialog.locator("blockquote.arrival-voice")).toHaveCount(2);

  // Return to the Trail, then re-open the multi-voice row from the reached list.
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const row = page.getByTestId("reached-row-lc-02-piper-landing");
  await expect(row).toBeVisible();
  await row.click();
  const reopened = page.getByRole("dialog");
  await expect(reopened.getByText("Meriwether Lewis")).toBeVisible();
  await expect(reopened.getByText("William Clark")).toBeVisible();
});
