import { useEffect } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { reviewShield, useStudio } from "~/features/configuracoes/stores/estudio";
import { markRootTheme } from "~/features/configuracoes/lib/normalizar-tema";

export function useAppearanceApplied() {
  const theme = useAppearance((s) => s.theme);
  const highlight = useAppearance((s) => s.highlight);
  const density = useAppearance((s) => s.density);
  const zoomDoApp = useAppearance((s) => s.zoomDoApp);
  const chatScale = useAppearance((s) => s.chatScale);
  const reduceAnimation = useAppearance((s) => s.reduceAnimation);
  const cornersRounded = useAppearance((s) => s.cornersRounded);
  const visibleFocusAlways = useAppearance((s) => s.visibleFocusAlways);
  const studioBrand = useStudio((s) =>
    Boolean(s.overrides["--color-brand"]),
  );

  useEffect(() => {
    document.documentElement.dataset.tema = theme;

    markRootTheme(theme);

    reviewShield();
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.densidade = density;
  }, [density]);

  useEffect(() => {
    const root = document.documentElement;

    if (zoomDoApp === 100) root.style.removeProperty("zoom");
    else root.style.setProperty("zoom", String(zoomDoApp / 100));
  }, [zoomDoApp]);

  useEffect(() => {
    const root = document.documentElement;

    if (chatScale === 100) root.style.removeProperty("--gc-escala-do-chat");
    else
      root.style.setProperty("--gc-escala-do-chat", String(chatScale / 100));
  }, [chatScale]);

  useEffect(() => {
    const root = document.documentElement;

    if (reduceAnimation) root.dataset.animacao = "reduzida";
    else delete root.dataset.animacao;
  }, [reduceAnimation]);

  useEffect(() => {
    const root = document.documentElement;

    if (cornersRounded) delete root.dataset.cantos;
    else root.dataset.cantos = "retos";
  }, [cornersRounded]);

  useEffect(() => {
    const root = document.documentElement;

    if (visibleFocusAlways) root.dataset.foco = "sempre";
    else delete root.dataset.foco;
  }, [visibleFocusAlways]);

  useEffect(() => {
    if (studioBrand) return;

    const root = document.documentElement;

    if (!highlight) {
      root.style.removeProperty("--color-brand");
      root.style.removeProperty("--color-brand-hover");
      return;
    }

    root.style.setProperty("--color-brand", highlight);
    root.style.setProperty(
      "--color-brand-hover",
      `color-mix(in oklab, ${highlight}, black 18%)`,
    );
  }, [highlight, studioBrand]);
}
