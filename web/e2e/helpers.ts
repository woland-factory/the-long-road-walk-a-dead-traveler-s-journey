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

// Land on Start and begin the Muir journey, ending on the empty Trail. With two
// packs in the picker the Begin buttons share a visible label, so we target the
// Muir card by its journey-specific accessible name.
export async function beginMuirJourney(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin A Thousand-Mile Walk to the Gulf" }).click();
  await expect(page.getByLabel("Miles walked today")).toBeVisible();
}

// Land on Start and begin the Lewis & Clark journey, ending on the empty Trail.
export async function beginLewisClarkJourney(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin Up the Missouri to Fort Mandan, 1804" }).click();
  await expect(page.getByLabel("Miles walked today")).toBeVisible();
}
