import React from "react";

import { urlDoEmoji } from "~/lib/twemoji";
import { cn } from "~/lib/utils";

interface EmojiProps {
  emoji: string;
  className?: string;
}

/**
 * Um emoji desenhado pelo Twemoji, com volta ao caractere quando não há desenho.
 *
 * O conjunto não cobre tudo: hoje são 45 dos 1.914 do nosso seletor sem arquivo
 * — os de Unicode 15.1 e 16, como as pessoas "viradas para a direita" e a cabeça
 * balançando. O `@twemoji/svg` está na 15.0.0, que é a última publicada, então
 * não é questão de atualizar.
 *
 * Para esses, volta o caractere e quem desenha é a fonte do sistema. É o
 * comportamento antigo do app, aplicado só onde não há alternativa — melhor um
 * emoji com a cara do sistema do que um buraco.
 *
 * O `alt` sozinho já mostrava o caractere numa imagem quebrada, mas dentro de
 * uma caixa do tamanho da imagem: o texto saía cortado ou desalinhado, e alguns
 * navegadores ainda desenham o ícone de imagem partida por cima. Trocar o
 * elemento resolve os dois.
 */
export const Emoji: React.FC<EmojiProps> = ({ emoji, className }) => {
  const [semDesenho, setSemDesenho] = React.useState(false);

  /*
    O caractere é a identidade do componente: trocá-lo tem que apagar a memória
    de que o anterior falhou. Sem isto, uma posição de lista que é reaproveitada
    — o seletor filtra, e o mesmo nó passa a mostrar outro emoji — herdaria a
    falha do emoji anterior e nunca mais mostraria imagem.
  */
  React.useEffect(() => setSemDesenho(false), [emoji]);

  if (semDesenho) {
    return (
      <span className={cn("inline-block text-center leading-none", className)}>{emoji}</span>
    );
  }

  return (
    <img
      src={urlDoEmoji(emoji)}
      alt={emoji}
      /*
        `draggable={false}` porque arrastar um emoji do meio de uma frase abre o
        arquivo SVG numa aba. Ninguém quer isso; quem quer o emoji, copia.
      */
      draggable={false}
      loading="lazy"
      onError={() => setSemDesenho(true)}
      className={cn("inline-block size-[1.375em] align-text-bottom", className)}
    />
  );
};
