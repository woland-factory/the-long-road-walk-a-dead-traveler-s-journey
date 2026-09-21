import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// T7: the README is part of the product. A stranger must understand it, run it
// with commands that match the real files, and see no factory internals. This
// locks each README command against the actual package.json scripts, compose
// file, and .env.example, so a future drift fails loudly.

const web = process.cwd(); // web/
const repoRoot = resolve(web, "..");
const readme = readFileSync(resolve(repoRoot, "README.md"), "utf8");
const pkg = JSON.parse(readFileSync(resolve(web, "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};

describe("README understand (AC7.1)", () => {
  it("explains the app in plain language: walk, earn the diary, daily check-in", () => {
    const lower = readme.toLowerCase();
    expect(lower).toContain("walk a real historic journey");
    expect(lower).toMatch(/diary|traveler'?s own|the traveler wrote/);
    expect(lower).toContain("daily check-in");
  });
});

describe("README run commands match the real files (AC7.2)", () => {
  // Every command the README tells a stranger to run must be a real script.
  const referenced = ["dev", "build", "preview", "typecheck", "validate:packs", "test:e2e"];
  for (const script of referenced) {
    it(`documents \`npm run ${script}\` and it exists in package.json`, () => {
      expect(pkg.scripts[script], `missing script ${script}`).toBeTruthy();
      expect(readme).toContain(`npm run ${script}`);
    });
  }

  it("documents `npm test` and the test script exists", () => {
    expect(pkg.scripts.test).toBeTruthy();
    expect(readme).toContain("npm test");
  });

  it("documents the build output directory that vite writes", () => {
    expect(readme).toContain("web/dist");
  });

  it("documents the Docker command against the real staging compose file", () => {
    expect(existsSync(resolve(repoRoot, "docker-compose.staging.yml"))).toBe(true);
    expect(readme).toContain("docker compose -f docker-compose.staging.yml up --build");
    expect(readme).toContain("/healthz");
  });
});

describe("README env vars cross-check .env.example (AC7.2)", () => {
  const envExample = readFileSync(resolve(repoRoot, ".env.example"), "utf8");
  const vars = ["SEED_DEMO", "SENTRY_DSN", "UMAMI_URL", "UMAMI_WEBSITE_ID"];
  for (const v of vars) {
    it(`${v} appears in both the README and .env.example`, () => {
      expect(readme).toContain(v);
      expect(envExample).toContain(v);
    });
  }
});

describe("README no factory internals (AC7.4)", () => {
  const forbidden = [
    "app factory",
    "orchestrator",
    "worktree",
    "result.json",
    "requested_tasks",
    "task_id",
  ];
  for (const token of forbidden) {
    it(`does not mention "${token}"`, () => {
      expect(readme.toLowerCase().includes(token)).toBe(false);
    });
  }
});
