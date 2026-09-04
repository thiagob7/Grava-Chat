import { useEffect } from "react";

import { useAparencia } from "~/stores/aparencia";
import { useEstudio } from "~/stores/estudio";

export function useAparenciaAplicada() {
  const tema = useAparencia((s) => s.tema);
  const destaque = useAparencia((s) => s.destaque);
  const densidade = useAparencia((s) => s.densidade);
  const zoomDoApp = useAparencia((s) => s.zoomDoApp);
  const escalaDoChat = useAparencia((s) => s.escalaDoChat);
  const reduzirAnimacao = useAparencia((s) => s.reduzirAnimacao);
  const cantosArredondados = useAparencia((s) => s.cantosArredondados);
  const focoSempreVisivel = useAparencia((s) => s.focoSempreVisivel);
  const marcaDoEstudio = useEstudio((s) =>
    Boolean(s.substituicoes["--color-brand"]),
  );

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    document.documentElement.dataset.densidade = densidade;
  }, [densidade]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (zoomDoApp === 100) raiz.style.removeProperty("zoom");
    else raiz.style.setProperty("zoom", String(zoomDoApp / 100));
  }, [zoomDoApp]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (escalaDoChat === 100) raiz.style.removeProperty("--gc-escala-do-chat");
    else
      raiz.style.setProperty("--gc-escala-do-chat", String(escalaDoChat / 100));
  }, [escalaDoChat]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (reduzirAnimacao) raiz.dataset.animacao = "reduzida";
    else delete raiz.dataset.animacao;
  }, [reduzirAnimacao]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (cantosArredondados) delete raiz.dataset.cantos;
    else raiz.dataset.cantos = "retos";
  }, [cantosArredondados]);

  useEffect(() => {
    const raiz = document.documentElement;

    if (focoSempreVisivel) raiz.dataset.foco = "sempre";
    else delete raiz.dataset.foco;
  }, [focoSempreVisivel]);

  useEffect(() => {
    if (marcaDoEstudio) return;

    const raiz = document.documentElement;

    if (!destaque) {
      raiz.style.removeProperty("--color-brand");
      raiz.style.removeProperty("--color-brand-hover");
      return;
    }

    raiz.style.setProperty("--color-brand", destaque);
    raiz.style.setProperty(
      "--color-brand-hover",
      `color-mix(in oklab, ${destaque}, black 18%)`,
    );
  }, [destaque, marcaDoEstudio]);
}
