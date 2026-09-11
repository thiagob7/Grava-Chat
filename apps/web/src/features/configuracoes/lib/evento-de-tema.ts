export const THEME_APPLIED = "gc:tema-aplicado";

export function notifyThemeApplied() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(THEME_APPLIED));
}
