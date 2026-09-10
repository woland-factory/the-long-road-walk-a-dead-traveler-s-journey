import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock the Sentry SDK so we can assert init gating without any network.
const initSpy = vi.fn();
vi.mock("@sentry/react", () => ({
  init: (...args: unknown[]) => initSpy(...args),
  captureException: vi.fn(),
}));

function setEnv(values: Record<string, string>) {
  window.__ENV__ = { SEED_DEMO: "false", SENTRY_DSN: "", UMAMI_URL: "", UMAMI_WEBSITE_ID: "", ...values };
}

beforeEach(() => {
  initSpy.mockClear();
  vi.resetModules();
  document.head.querySelectorAll("script[data-umami-injected]").forEach((n) => n.remove());
});

afterEach(() => {
  delete window.__ENV__;
});

describe("observability gating with no env (AC2.1)", () => {
  it("does not initialize Sentry and injects no Umami script", async () => {
    setEnv({});
    const { initSentry } = await import("./observability/sentry");
    const { initUmami } = await import("./observability/umami");
    initSentry();
    initUmami();
    expect(initSpy).not.toHaveBeenCalled();
    expect(document.head.querySelector("script[data-umami-injected]")).toBeNull();
  });
});

describe("observability gating with env present (AC2.2)", () => {
  it("initializes Sentry when a DSN is set", async () => {
    setEnv({ SENTRY_DSN: "https://examplePublicKey@o0.ingest.example.com/0" });
    const { initSentry } = await import("./observability/sentry");
    initSentry();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy.mock.calls[0][0]).toMatchObject({
      dsn: "https://examplePublicKey@o0.ingest.example.com/0",
    });
  });

  it("injects the Umami script with the website id when url and id are set", async () => {
    setEnv({ UMAMI_URL: "https://umami.example.com/script.js", UMAMI_WEBSITE_ID: "abc-123" });
    const { initUmami } = await import("./observability/umami");
    initUmami();
    const script = document.head.querySelector<HTMLScriptElement>("script[data-umami-injected]");
    expect(script).not.toBeNull();
    expect(script?.src).toBe("https://umami.example.com/script.js");
    expect(script?.getAttribute("data-website-id")).toBe("abc-123");
  });

  it("does not inject Umami when only the url is set", async () => {
    setEnv({ UMAMI_URL: "https://umami.example.com/script.js" });
    const { initUmami } = await import("./observability/umami");
    initUmami();
    expect(document.head.querySelector("script[data-umami-injected]")).toBeNull();
  });
});
