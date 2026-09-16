import { useEffect } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { appColorsCss, TINTED_TOKENS, type TintedToken } from "~/features/tema/lib/app-colors";
import { useAppColors } from "~/features/tema/stores/app-colors";
import { usePlanLimits } from "~/features/plan/stores/plan-store";

const STYLE_ID = "gravae-cores-do-app";

const sheet = () => {
  const found = document.getElementById(STYLE_ID);
  if (found) return found as HTMLStyleElement;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  document.head.append(style);
  return style;
};

function baseValues(style: HTMLStyleElement): Partial<Record<TintedToken, string>> {
  const wasEmpty = style.textContent;
  style.textContent = "";

  const computed = getComputedStyle(document.documentElement);
  const base = Object.fromEntries(
    TINTED_TOKENS.map((token) => [token, computed.getPropertyValue(token).trim()]).filter(([, value]) => value),
  ) as Partial<Record<TintedToken, string>>;

  style.textContent = wasEmpty;
  return base;
}

export function useAppColorsApplied() {
  const colors = useAppColors((s) => s.colors);
  const angle = useAppColors((s) => s.angle);
  const intensity = useAppColors((s) => s.intensity);
  const theme = useAppearance((s) => s.theme);
  const allowed = usePlanLimits().customColors;

  useEffect(() => {
    const style = sheet();
    const root = document.documentElement;

    if (!allowed || !colors.length) {
      style.textContent = "";
      root.classList.remove("app-colors");
      return;
    }

    style.textContent = appColorsCss(baseValues(style), { colors, angle, intensity });
    root.classList.add("app-colors");
  }, [allowed, colors, angle, intensity, theme]);
}
