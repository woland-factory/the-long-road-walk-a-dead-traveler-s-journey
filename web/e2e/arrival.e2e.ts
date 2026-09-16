import { test, expect } from "@playwright/test";
import { beginMuirJourney, markWalkthroughDone } from "./helpers";

// AC8.2: from a fresh app, cross the first Muir milepost, read the verbatim
// entry in the Arrival, write a facing line, return to the Trail, then re-open
// the reached row and see the same entry with the saved line.
test("cross a milepost, read the entry, write a line, return, and re-open it", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await expect(page.getByText("Your road starts here")).toBeVisible();

  // Cross the first milepost (mile 6): the Arrival ceremony opens.
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/My plan was simply to push on/)).toBeVisible();
  // The place heading and the framing note are part of the ceremony.
  await expect(dialog.getByRole("heading", { name: "Louisville, Kentucky" })).toBeVisible();
  await expect(dialog.getByText(/You are reading his exact words/)).toBeVisible();

  // Write the walker's facing line, then return to the Trail.
  const line = "Rain most of the way. Legs tired, mind clear.";
  await dialog.getByLabel("Your line for this milepost").fill(line);
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // The reached row is present; re-open it.
  const row = page.getByTestId("reached-row-muir-01-louisville");
  await expect(row).toBeVisible();
  await row.click();

  // The same entry, with the saved facing line restored.
  const reopened = page.getByRole("dialog");
  await expect(reopened.getByText(/My plan was simply to push on/)).toBeVisible();
  await expect(reopened.getByLabel("Your line for this milepost")).toHaveValue(line);
});
