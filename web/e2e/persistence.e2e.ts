import { test, expect } from "@playwright/test";

// AC5.2: after a full page reload, the odometer, reached mileposts, and
// revealed fixture text all persist (loaded from IndexedDB).
test("logged miles and revealed mileposts survive a reload", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Your road starts here")).toBeVisible();

  // Cross the first fixture milepost (mile 5).
  await page.getByLabel("Miles walked today").fill("6");
  await page.getByRole("button", { name: "Log miles" }).click();

  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  await expect(page.getByText(/We crossed the river at dawn/)).toBeVisible();

  await page.reload();

  // State restored from IndexedDB with no re-entry.
  await expect(page.getByTestId("odometer-value")).toHaveText("6");
  await expect(page.getByText(/We crossed the river at dawn/)).toBeVisible();
});
