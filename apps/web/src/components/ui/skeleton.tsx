import React from "react";

import { cn } from "~/lib/utils";

/**
 * O bloco cinza que ocupa o lugar de um conteúdo que ainda não chegou.
 *
 * A diferença para um "Carregando…" não é enfeite: o texto diz que algo vem,
 * o esqueleto diz **o que** vem e **onde**. Quem abre um canal grande espera
 * meio segundo olhando para o formato da conversa em vez de para uma frase
 * centralizada — e quando as mensagens entram, elas entram no lugar onde os
 * olhos já estavam, sem o salto de layout que o texto causa ao sumir.
 *
 * `aria-hidden` porque ele não é conteúdo: quem usa leitor de tela não ganha
 * nada ouvindo "imagem, imagem, imagem". Quem anuncia a espera é a região viva
 * de quem o desenha.
 */
export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <span
    aria-hidden
    style={style}
    className={cn("block animate-pulse rounded bg-ink-faint/15", className)}
  />
);

/**
 * Larguras que variam, e variam SEMPRE IGUAL.
 *
 * Linhas de tamanho idêntico não parecem texto, parecem tabela. E sorteá-las a
 * cada desenho faz o esqueleto tremer entre um quadro e outro, porque o React
 * redesenha por qualquer motivo. Um índice entrando numa lista fixa dá as duas
 * coisas: irregularidade na tela e estabilidade no tempo.
 */
const LARGURAS = ["92%", "64%", "78%", "45%", "85%", "58%", "70%", "38%"];

export const larguraDaLinha = (indice: number) =>
  LARGURAS[indice % LARGURAS.length]!;
