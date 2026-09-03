import { useEffect } from "react";

import { useAparencia } from "~/stores/aparencia";
import { useEstudio } from "~/stores/estudio";

/**
 * O tema saindo da preferência e chegando na tela.
 *
 * Dois atributos na raiz e uma variável — é tudo. As cores vivem no CSS
 * (`:root[data-tema="claro"]` e companhia), então trocar de tema aqui é
 * escrever uma palavra no `<html>`: nenhum componente sabe que existe tema,
 * e nada re-renderiza.
 */
export function useAparenciaAplicada() {
  const tema = useAparencia((s) => s.tema);
  const destaque = useAparencia((s) => s.destaque);
  const densidade = useAparencia((s) => s.densidade);
  const zoomDoApp = useAparencia((s) => s.zoomDoApp);
  const escalaDoChat = useAparencia((s) => s.escalaDoChat);
  const reduzirAnimacao = useAparencia((s) => s.reduzirAnimacao);
  const cantosArredondados = useAparencia((s) => s.cantosArredondados);
  const focoSempreVisivel = useAparencia((s) => s.focoSempreVisivel);
  /*
    Quem mexeu na marca dentro do estúdio manda mais que a bolinha de destaque:
    é a escolha mais específica das duas. Sem esta trava, as duas escreviam na
    mesma variável em linha e a última a rodar ganhava — o que, na prática,
    fazia a cor do estúdio sumir a cada recarga.
  */
  const marcaDoEstudio = useEstudio((s) =>
    Boolean(s.substituicoes["--color-brand"]),
  );

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
  }, [tema]);

  useEffect(() => {
    document.documentElement.dataset.densidade = densidade;
  }, [densidade]);

  /*
    O zoom do app.

    `zoom` na raiz, e não `font-size`: o app tem medidas em pixel — o trilho de
    72px, os avatares, a altura da barra do canal — e com `font-size` só o que
    está em `rem` cresceria. A tela ficaria com o texto grande dentro de caixas
    do tamanho antigo.
  */
  useEffect(() => {
    const raiz = document.documentElement;

    if (zoomDoApp === 100) raiz.style.removeProperty("zoom");
    else raiz.style.setProperty("zoom", String(zoomDoApp / 100));
  }, [zoomDoApp]);

  /// A escala do chat vira variável; quem lê é o CSS da mensagem.
  useEffect(() => {
    const raiz = document.documentElement;

    if (escalaDoChat === 100) raiz.style.removeProperty("--gc-escala-do-chat");
    else
      raiz.style.setProperty("--gc-escala-do-chat", String(escalaDoChat / 100));
  }, [escalaDoChat]);

  /*
    Reduzir animação é uma DECISÃO da pessoa, e por isso um atributo próprio —
    não dá pra escrever em `prefers-reduced-motion`, que é do sistema. O CSS
    atende os dois: quem pediu no sistema já vinha atendido, e agora quem pede
    aqui também.
  */
  useEffect(() => {
    const raiz = document.documentElement;

    if (reduzirAnimacao) raiz.dataset.animacao = "reduzida";
    else delete raiz.dataset.animacao;
  }, [reduzirAnimacao]);

  /*
    Cantos retos, quando pedidos.

    O atributo é a AUSÊNCIA do arredondado, e não a presença: no navegador não
    há canto nenhum para arredondar, e um atributo que diz "arredondado" ali
    seria uma promessa que a tela não cumpre. Assim o CSS só precisa saber
    desfazer, e desfaz onde há o que desfazer.
  */
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
    /*
      O hover é a mesma cor um pouco mais escura. `color-mix` faz a conta no
      navegador — sem ele seria preciso guardar duas cores por opção e, pior,
      confiar que quem escolher a cor escolha as duas em harmonia.
    */
    raiz.style.setProperty(
      "--color-brand-hover",
      `color-mix(in oklab, ${destaque}, black 18%)`,
    );
  }, [destaque, marcaDoEstudio]);
}
