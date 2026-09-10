import { defineConfig } from "vitest/config";
import type { Plugin, ViteDevServer, PreviewServer } from "vite";
import react from "@vitejs/plugin-react";

// Mirror the nginx `/healthz` route in dev and preview so the same
// end-to-end health check runs against the local server and the container.
function healthz(): Plugin {
  const handler = (server: ViteDevServer | PreviewServer) => {
    server.middlewares.use("/healthz", (_req, res) => {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      res.end("ok");
    });
  };
  return {
    name: "healthz",
    configureServer: handler,
    configurePreviewServer: handler,
  };
}

export default defineConfig({
  plugins: [react(), healthz()],
  build: {
    // Deterministic hashed asset names so the no-secrets grep is stable.
    sourcemap: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "node_modules/**"],
  },
});
