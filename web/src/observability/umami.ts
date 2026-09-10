import { env } from "../env";

// Inject the Umami analytics script only when both the URL and website id are
// present. No-op otherwise, so no analytics request is made when unconfigured.
export function initUmami(): void {
  const url = env.umamiUrl;
  const websiteId = env.umamiWebsiteId;
  if (!url || !websiteId) return;
  if (typeof document === "undefined") return;
  if (document.querySelector("script[data-umami-injected]")) return;

  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.src = url;
  script.setAttribute("data-website-id", websiteId);
  script.setAttribute("data-umami-injected", "true");
  document.head.appendChild(script);
}
