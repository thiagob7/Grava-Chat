import { isDesktop } from "~/lib/desktop";

export function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (isDesktop()) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
