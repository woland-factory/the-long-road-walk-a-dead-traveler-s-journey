// Typed access to the runtime config injected by /config.js.
// Every getter has a safe fallback so a missing or partial config.js
// never crashes the app.

interface RuntimeEnv {
  SEED_DEMO: string;
  SENTRY_DSN: string;
  UMAMI_URL: string;
  UMAMI_WEBSITE_ID: string;
}

declare global {
  interface Window {
    __ENV__?: Partial<RuntimeEnv>;
  }
}

function raw(): Partial<RuntimeEnv> {
  return (typeof window !== "undefined" && window.__ENV__) || {};
}

function str(key: keyof RuntimeEnv): string {
  const value = raw()[key];
  return typeof value === "string" ? value : "";
}

export const env = {
  get seedDemo(): boolean {
    const v = str("SEED_DEMO").trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  },
  get sentryDsn(): string {
    return str("SENTRY_DSN").trim();
  },
  get umamiUrl(): string {
    return str("UMAMI_URL").trim();
  },
  get umamiWebsiteId(): string {
    return str("UMAMI_WEBSITE_ID").trim();
  },
};
