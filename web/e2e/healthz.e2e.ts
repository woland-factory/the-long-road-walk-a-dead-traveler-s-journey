import { test, expect } from "@playwright/test";

// AC9.1/AC9.2/AC9.4: the app root serves HTML and /healthz returns 200 "ok".
// The dev/preview server mirrors the nginx /healthz route, so the same check
// runs locally and against the container.
test("serves the SPA at the root", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("#root")).toBeVisible();
  await expect(page.getByRole("heading", { name: "The Long Road" })).toBeVisible();
});

test("answers /healthz with 200 ok", async ({ request }) => {
  const res = await request.get("/healthz");
  expect(res.status()).toBe(200);
  expect((await res.text()).trim()).toBe("ok");
});
