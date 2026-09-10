import { ehDesktop } from "~/lib/desktop";

export function registrarServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  if (ehDesktop()) return;
  if (import.meta.env.DEV) return;

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
