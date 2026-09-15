import { test, expect } from "@playwright/test";

// AC8.3: the full wipe-and-restore round trip. Cross the first Muir milepost,
// save a backup, delete the IndexedDB database, reload to the empty state,
// restore from the saved file, and see the same miles and reached row again.
test("a saved backup survives a full wipe and restores the journal", async ({ page }) => {
  await page.goto("/");
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

  // A fresh device: the empty trail, with restore reachable.
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();
  await expect(page.getByTestId("odometer-value")).toHaveCount(0);

  // Restore from the saved file: no confirm prompt on a fresh device.
  await page.getByLabel("Restore from a backup").setInputFiles(savedPath!);
  await expect(page.getByText("Your journal is restored.")).toBeVisible();

  // The odometer and the reached row come back with the same entry.
  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  const row = page.getByTestId("reached-row-muir-01-louisville");
  await expect(row).toBeVisible();

  // And the restored state survives a reload (it was persisted).
  await page.reload();
  await expect(page.getByTestId("odometer-value")).toHaveText("6");

  // The earned entry reads again from the restored state.
  await page.getByTestId("reached-row-muir-01-louisville").click();
  await expect(page.getByRole("dialog").getByText(/My plan was simply to push on/)).toBeVisible();
});
