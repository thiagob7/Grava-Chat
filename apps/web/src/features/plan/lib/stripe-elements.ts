import { loadStripe, type Appearance } from "@stripe/stripe-js";

const cached = new Map<string, ReturnType<typeof loadStripe>>();

export const stripeOf = (publishableKey: string) => {
  if (!cached.has(publishableKey)) cached.set(publishableKey, loadStripe(publishableKey));
  return cached.get(publishableKey)!;
};

const readVariable = (name: string, fallback: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

export const appearanceFromTheme = (): Appearance => ({
  theme: "night",
  variables: {
    colorPrimary: readVariable("--color-brand", "#5865f2"),
    colorBackground: readVariable("--color-surface-2", "#1e1f22"),
    colorText: readVariable("--color-ink", "#f2f3f5"),
    colorTextSecondary: readVariable("--color-ink-muted", "#b5bac1"),
    colorDanger: readVariable("--color-danger", "#f23f43"),
    borderRadius: "8px",
    fontFamily: readVariable("--font-sans", "system-ui, sans-serif"),
  },
});
