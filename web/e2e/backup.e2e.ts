import { test, expect } from "@playwright/test";
import { beginMuirJourney, markWalkthroughDone } from "./helpers";

// AC8.3 / AC7.7: the full wipe-and-restore round trip through the new front
// door. Cross the first Muir milepost, save a backup, delete the database and
// local flags, then restore from the Start screen's restore control and land on
// the Trail with the odometer and reached row intact and no walkthrough.
test("a saved backup restores from the Start screen after a full wipe", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);
  await expect(page.getByText("Your road starts here")).toBeVisible();

  // Cross the first milepost and close the Arrival.
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByTestId("odometer-value")).toHaveText("6");

  // Save a backup and capture the downloaded file.
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Save a backup" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("the-long-road-muir-thousand-mile-walk-backup.json");
  const savedPath = await download.path();
  expect(savedPath).toBeTruthy();
  await expect(page.getByText(/Saved\./)).toBeVisible();

  // Wipe the device: delete the database from a page that holds no open
  // connection (the /healthz page is served same-origin without the app).
  await page.goto("/healthz");
  await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.deleteDatabase("the-long-road");
        request.onsuccess = () => resolve(null);
        request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error("delete blocked"));
      }),
  );
  await page.evaluate(() => window.localStorage.clear());

  // A fresh device now lands on the Start screen, with restore reachable.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Choose a journey" })).toBeVisible();

  // Restore from the saved file: no confirm prompt on a fresh device.
  await page.getByLabel("Restore from a backup").setInputFiles(savedPath!);

  // The Trail comes back with the same miles and reached row, no walkthrough.
  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  await expect(page.getByTestId("reached-row-muir-01-louisville")).toBeVisible();
  await expect(page.getByText("Return each day to earn the next entry.")).toHaveCount(0);
  await expect(page.getByText("Log the miles you walked today.")).toHaveCount(0);

  // And the restored state survives a reload (it was persisted).
  await page.reload();
  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  await page.getByTestId("reached-row-muir-01-louisville").click();
  await expect(page.getByRole("dialog").getByText(/My plan was simply to push on/)).toBeVisible();
});
