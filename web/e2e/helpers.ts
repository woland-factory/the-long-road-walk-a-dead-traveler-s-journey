import { expect, type Page } from "@playwright/test";

// Shared setup for the specs that run past the Start gate. The gate now fronts
// a fresh context, so a spec that is not about the first run begins the Muir
// journey and pre-marks the walkthrough done.

// Pre-set the device-local walkthrough flag before the app loads, so the guided
// first run never shows for specs that are not testing it.
export async function markWalkthroughDone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("the-long-road:walkthrough-done", "1");
    } catch {
      // localStorage may be sealed; the walkthrough is harmless if it shows.
    }
  });
}

// Land on Start and begin the Muir journey, ending on the empty Trail.
export async function beginMuirJourney(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin this journey" }).click();
  await expect(page.getByLabel("Miles walked today")).toBeVisible();
}
