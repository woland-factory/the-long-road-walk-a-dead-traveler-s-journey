import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { beginMuirJourney, markWalkthroughDone } from "./helpers";

const fixture = (name: string) => resolve(process.cwd(), "e2e/fixtures", name);

// AC7.4 / AC7.5: the second input path, end to end. Both formats parse on the
// device, cross mileposts through the real Arrival, reject bad files with
// designed errors, re-import idempotently, and send nothing to the network.
test("imports CSV and Apple XML, rejects bad files, and never touches the network", async ({ page }) => {
  await markWalkthroughDone(page);
  await beginMuirJourney(page);

  // The on-device promise: capture any dynamic request during the whole flow.
  const dynamicRequests: string[] = [];
  page.on("request", (req) => {
    const type = req.resourceType();
    if (type === "fetch" || type === "xhr") dynamicRequests.push(req.url());
  });

  const openImporter = async () => {
    await page.getByRole("button", { name: "Add miles from a file" }).click();
    await expect(page.getByRole("heading", { name: "Add miles from a file" })).toBeVisible();
  };

  // A multi-day CSV whose total crosses the first milepost.
  await openImporter();
  await page.getByLabel("Choose a file").setInputFiles(fixture("walks.csv"));
  await expect(page.getByText("Add 3 days, 7.5 miles, from March 1, 2024 to March 3, 2024.")).toBeVisible();
  await page.getByRole("button", { name: "Add these miles" }).click();
  await expect(page.getByRole("dialog").getByText(/My plan was simply to push on/)).toBeVisible();
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByTestId("odometer-value")).toHaveText("7.5");

  // An Apple export with a km record and a two-source day proves the conversion
  // and the largest-source rule: 2 (watch, not 3.5 summed) + 5 (8.04672 km) = 7.
  await openImporter();
  await page.getByLabel("Choose a file").setInputFiles(fixture("export-small.xml"));
  await expect(page.getByText("Add 2 days, 7 miles, from April 1, 2024 to April 2, 2024.")).toBeVisible();
  await page.getByRole("button", { name: "Add these miles" }).click();
  await expect(page.getByTestId("odometer-value")).toHaveText("14.5");

  // Re-importing the same CSV adds nothing: no confirm control, honest counts.
  await openImporter();
  await page.getByLabel("Choose a file").setInputFiles(fixture("walks.csv"));
  await expect(page.getByText("These miles are already on your trail.")).toBeVisible();
  await expect(page.getByText("3 days you already logged stay as you logged them.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Add these miles" })).toHaveCount(0);
  await page.getByRole("button", { name: "Back to the trail" }).click();

  // Each bad file shows its designed error and changes nothing. Rejections keep
  // the chooser up, so one open importer handles them all.
  await openImporter();
  await page.getByLabel("Choose a file").setInputFiles(fixture("walks-malformed.csv"));
  await expect(page.getByRole("alert")).toContainText("Line 3 needs the form 2026-06-01,3.5.");
  await page.getByLabel("Choose a file").setInputFiles(fixture("export-empty.xml"));
  await expect(page.getByRole("alert")).toContainText("This file holds no walking distance.");
  await page.getByLabel("Choose a file").setInputFiles(fixture("notes.txt"));
  await expect(page.getByRole("alert")).toContainText("Choose a date,miles CSV or an Apple Health export.xml.");

  // Nothing changed from the errors: still 14.5 back on the trail.
  await page.getByRole("button", { name: "Back to the trail" }).click();
  await expect(page.getByTestId("odometer-value")).toHaveText("14.5");

  // The whole flow made no dynamic network request.
  expect(dynamicRequests).toEqual([]);
});
