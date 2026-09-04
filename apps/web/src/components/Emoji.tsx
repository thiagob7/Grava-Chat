import React from "react";

import { urlDoEmoji } from "~/lib/twemoji";
import { cn } from "~/lib/utils";

interface EmojiProps {
  emoji: string;
  className?: string;
}

/**
 * Um emoji desenhado pelo Twemoji.
 *
 * O `alt` é o próprio caractere, e isso não é acessibilidade por tabela: é o
 * que faz copiar a mensagem devolver o emoji, e não um buraco. Leitor de tela
 * lê o caractere, que é o que ele já sabia ler.
 *
 * Quando o arquivo não existe — emoji novo demais, ou uma sequência que o
 * Twemoji não desenha —, a imagem some e sobra o caractere. É por isso que ele
 * está no `alt` e não num `aria-label`: o texto alternativo é justamente o que
 * o navegador mostra no lugar da imagem quebrada, então o pior caso volta a ser
 * exatamente o que o app fazia antes.
 */
export const Emoji: React.FC<EmojiProps> = ({ emoji, className }) => (
  <img
    src={urlDoEmoji(emoji)}
    alt={emoji}
    /*
      `draggable={false}` porque arrastar um emoji do meio de uma frase abre o
      arquivo SVG numa aba. Ninguém quer isso; quem quer o emoji, copia.
    */
    draggable={false}
    loading="lazy"
    className={cn("inline-block size-[1.375em] align-text-bottom", className)}
  />
);
