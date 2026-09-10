import { test, expect } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

// AC2.3: no DSN, website id, or seed value is baked into the built JS bundle.
// The webServer runs `npm run build` with these envs unset before the suite,
// so dist reflects an unconfigured build. We grep for sentinel values.
test("built bundle contains no injected env values", () => {
  const assetsDir = resolve(process.cwd(), "dist/assets");
  const jsFiles = readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  expect(jsFiles.length).toBeGreaterThan(0);

  const sentinels = [
    "https://examplePublicKey@o0.ingest.example.com/0", // a DSN value
    "umami-website-id-sentinel",
    "SEED_DEMO_VALUE_SENTINEL",
  ];

  const combined = jsFiles.map((f) => readFileSync(resolve(assetsDir, f), "utf8")).join("\n");
  for (const sentinel of sentinels) {
    expect(combined.includes(sentinel)).toBe(false);
  }
});
