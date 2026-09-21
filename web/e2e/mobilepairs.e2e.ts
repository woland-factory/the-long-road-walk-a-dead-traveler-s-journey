import { test, expect, type Page } from "@playwright/test";
import { beginMuirJourney, beginLewisClarkJourney, markWalkthroughDone } from "./helpers";

// T3: the surfaces that carry the payoff read cleanly at 390px, and the one
// facing-page breakpoint still applies above 720px so a 390px fix never breaks
// the true two-page spread.

async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const el = document.scrollingElement!;
    return el.scrollWidth - el.clientWidth;
  });
}

test.describe("multi-voice Arrival at 390px (AC3.3)", () => {
  test.use({ viewport: { width: 390, height: 780 } });

  test("two keepers stack legibly with no horizontal scroll", async ({ page }) => {
    await beginLewisClarkJourney(page);
    await page.getByLabel("Miles walked today").fill("15");
    await page.getByRole("button", { name: "Log miles" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.getByRole("button", { name: "Next entry" }).click();
    await expect(dialog.getByRole("heading", { name: "near Mr. Piper's Landing" })).toBeVisible();

    // Both voices render, each attributed to its own keeper.
    const voices = dialog.locator("blockquote.arrival-voice");
    await expect(voices).toHaveCount(2);
    await expect(dialog.getByText("Meriwether Lewis")).toBeVisible();
    await expect(dialog.getByText("William Clark")).toBeVisible();

    // The two voices are visibly separated: the second sits below the first.
    const first = await voices.nth(0).boundingBox();
    const second = await voices.nth(1).boundingBox();
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height - 2);

    // No horizontal scroll, and the reading column stays inside the viewport.
    expect(await horizontalOverflow(page)).toBeLessThanOrEqual(1);
    const textBox = await voices.nth(0).locator(".voice-text").boundingBox();
    expect(textBox!.width).toBeLessThanOrEqual(390);
  });
});

test.describe("the facing-page grid still applies above 720px (AC3.4)", () => {
  test.use({ viewport: { width: 960, height: 900 } });

  test("a journal spread is a two-column facing pair on a wide viewport", async ({ page }) => {
    await markWalkthroughDone(page);
    await beginMuirJourney(page);
    await page.getByLabel("Miles walked today").fill("6");
    await page.getByRole("button", { name: "Log miles" }).click();
    await page.getByRole("button", { name: "Back to the trail" }).click();
    await page.getByRole("button", { name: "Read your journal" }).click();
    await expect(page.getByRole("heading", { name: "A Thousand-Mile Walk to the Gulf" })).toBeVisible();

    const spread = page.locator(".journal-spread").first();
    // Both the traveler side and the walker side are present.
    await expect(spread.locator(".spread-traveler")).toBeVisible();
    await expect(spread.locator(".spread-walker")).toBeVisible();

    // Above 720px the spread is a two-track grid: a real facing pair.
    const columns = await spread.evaluate((el) => getComputedStyle(el).gridTemplateColumns);
    expect(columns.trim().split(/\s+/).length).toBe(2);
  });
});
