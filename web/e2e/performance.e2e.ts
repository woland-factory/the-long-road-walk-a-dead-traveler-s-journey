import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { bootSeededDemo } from "./helpers";

// T2: performance is a client-side fact here. First meaningful render is real
// content with no runtime pack or diary fetch, and the entry chunk the browser
// parses before first paint stays within a fixed budget so an accidental import
// of a large source file fails loudly.

// AC2.1: real content fast, never blank, and no runtime pack/diary round-trip.
test("AC2.1 first render is real content with no pack or diary fetch", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  await bootSeededDemo(page); // masthead + seeded Trail paint, no user input

  await expect(page.getByRole("heading", { level: 1, name: "The Long Road" })).toBeVisible();
  await expect(page.getByTestId("odometer-value")).toBeVisible();

  // Packs are bundled JSON and the diary source .txt is never imported by app
  // code, so no request fetches pack or diary data on the hot path.
  for (const url of requests) {
    expect(url, `unexpected diary source fetch: ${url}`).not.toMatch(/\.txt(\?|$)/i);
    expect(url, `unexpected gutenberg fetch: ${url}`).not.toMatch(/gutenberg/i);
    expect(url, `unexpected pack fetch: ${url}`).not.toMatch(/packs?\/[^/]+\.json/i);
  }
});

// AC2.2: the entry chunk stays within a gzipped ceiling. The ceiling is the
// current size plus generous headroom: a regression guard, not a shrink target.
// Importing a diary source file (hundreds of KB) would blow past it and fail.
test("AC2.2 the entry JS chunk stays within its gzipped budget", () => {
  const distDir = resolve(process.cwd(), "dist");
  const html = readFileSync(resolve(distDir, "index.html"), "utf8");
  const match = html.match(/assets\/[^"']+\.js/);
  expect(match, "entry script not found in dist/index.html").not.toBeNull();

  const entry = resolve(distDir, match![0]);
  const gzipped = gzipSync(readFileSync(entry)).length;

  const CEILING = 130 * 1024; // ~130 KB gzipped; current entry is ~96 KB
  expect(gzipped).toBeLessThan(CEILING);
});
