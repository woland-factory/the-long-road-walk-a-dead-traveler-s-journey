import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initSentry } from "./observability/sentry";
import { initUmami } from "./observability/umami";
import "./styles/app.css";

// Bootstrap: wire observability (each is a no-op without its env), then render.
initSentry();
initUmami();

const rootEl = document.getElementById("root");
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
