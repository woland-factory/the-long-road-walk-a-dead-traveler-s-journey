import { test, expect } from "@playwright/test";
import { beginMuirJourney, markWalkthroughDone } from "./helpers";

// AC7.2: crossing the first Muir milepost opens the Arrival with the verbatim
// entry. After returning to the Trail and reloading, the odometer and reached
// row persist, and re-opening the row reads the same entry again.
test("a reached entry is re-readable from the Trail and survives a reload", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await expect(page.getByText("Your road starts here")).toBeVisible();

  // Cross the first Muir milepost (mile 6): the Arrival opens automatically.
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/My plan was simply to push on/)).toBeVisible();

  // Back to the Trail: the verbatim text leaves the DOM, the reached row remains.
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText(/My plan was simply to push on/)).toHaveCount(0);
  await expect(page.getByTestId("odometer-value")).toHaveText("6");

  await page.reload();

  // State restored from IndexedDB with no re-entry: odometer and the row.
  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  const row = page.getByTestId("reached-row-muir-01-louisville");
  await expect(row).toBeVisible();

  // Re-open the row to read the same verbatim entry again.
  await row.click();
  await expect(page.getByRole("dialog").getByText(/My plan was simply to push on/)).toBeVisible();
});
