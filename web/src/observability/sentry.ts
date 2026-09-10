import * as Sentry from "@sentry/react";
import { env } from "../env";

let started = false;

// Initialize Sentry only when a DSN is present. No-op otherwise, so the app
// makes no network calls to Sentry when unconfigured.
export function initSentry(): void {
  if (started) return;
  const dsn = env.sentryDsn;
  if (!dsn) return;
  Sentry.init({
    dsn,
    // No PII: there is no user identity, and we never attach request data.
    sendDefaultPii: false,
    tracesSampleRate: 0,
  });
  started = true;
}

// Report a caught error when Sentry is active; safe no-op otherwise.
export function reportError(error: unknown): void {
  if (!started) return;
  Sentry.captureException(error);
}
