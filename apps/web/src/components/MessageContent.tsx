import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import { MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { useLightbox } from "~/stores/lightbox";

/**
 * O texto da mensagem: emojis do servidor viram imagem, links viram link, e
 * uma mensagem que é SÓ um link de imagem vira a imagem.
 *
 * `:nome:` e a URL são o que ficam gravados no banco — guardar já como HTML
 * deixaria o histórico dependente de como a tela renderiza hoje, e um emoji
 * renomeado quebraria mensagens antigas.
 */
const EMOJI = /:([a-zA-Z0-9_]{2,32}):/g;
const LINK = /https?:\/\/[^\s<]+/g;
/** Sem `g`: um `.test` num regex global mexe no `lastIndex` e quebra o matchAll. */
const SO_UM_LINK = /^https?:\/\/\S+$/;

/** Pontuação colada no fim não faz parte do endereço: "veja https://x.com/a." */
const limpar = (url: string) => url.replace(/[.,;:!?)\]}]+$/, "");

const EH_IMAGEM = /\.(gif|png|jpe?g|webp|avif)(\?|#|$)/i;

interface MessageContentProps {
  content: string;
  emojis: GuildEmoji[];
  /** só emoji na mensagem inteira? aí eles vão grandes, como no Discord */
  className?: string;
}

/** Troca `:nome:` pelos emojis do servidor. Só texto entra aqui — link, não. */
function comEmojis(texto: string, porNome: Map<string, GuildEmoji>, chave: string) {
  const partes: React.ReactNode[] = [];
  let ultimo = 0;

  for (const casamento of texto.matchAll(EMOJI)) {
    const emoji = porNome.get(casamento[1]!);
    if (!emoji || casamento.index === undefined) continue;

    if (casamento.index > ultimo) partes.push(texto.slice(ultimo, casamento.index));

    partes.push(
      <img
        key={`${chave}-${emoji.id}-${casamento.index}`}
        src={emoji.url}
        alt={`:${emoji.name}:`}
        title={`:${emoji.name}:`}
        className="inline-block size-6 align-text-bottom"
      />,
    );

    ultimo = casamento.index + casamento[0].length;
  }

  if (!partes.length) return [texto];
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));

  return partes;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content, emojis, className }) => {
  // antes de qualquer return: hook não pode ficar atrás de condição
  const abrirImagem = useLightbox((s) => s.abrir);

  if (!content) return null;

  /**
   * Mensagem que é só um endereço de imagem vira a imagem — é o que o seletor
   * de GIF produz, e sem isto o GIF chegava como uma URL escrita por extenso.
   * `loading="lazy"` porque um canal antigo pode ter dezenas deles.
   */
  const sozinho = content.trim();
  if (SO_UM_LINK.test(sozinho) && EH_IMAGEM.test(limpar(sozinho))) {
    return (
      <button
        onClick={() => abrirImagem(sozinho)}
        aria-label="Ver imagem"
        className="mt-1 block overflow-hidden rounded transition hover:brightness-110"
      >
        <img
          src={sozinho}
          alt=""
          loading="lazy"
          decoding="async"
          // o mesmo teto dos anexos: um GIF não pode empurrar a conversa
          style={{ maxWidth: MAX_IMAGEM_W, maxHeight: MAX_IMAGEM_H }}
          className="block h-auto w-auto object-contain"
        />
      </button>
    );
  }

  const porNome = new Map(emojis.map((e) => [e.name, e]));
  const partes: React.ReactNode[] = [];
  let ultimo = 0;

  for (const casamento of content.matchAll(LINK)) {
    if (casamento.index === undefined) continue;

    const url = limpar(casamento[0]);
    if (casamento.index > ultimo) {
      partes.push(...comEmojis(content.slice(ultimo, casamento.index), porNome, `t${ultimo}`));
    }

    partes.push(
      <a
        key={`l${casamento.index}`}
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-brand hover:underline"
      >
        {url}
      </a>,
    );

    // o que sobrou da pontuação volta como texto
    ultimo = casamento.index + url.length;
  }

  if (ultimo < content.length) {
    partes.push(...comEmojis(content.slice(ultimo), porNome, `t${ultimo}`));
  }

  return <span className={className}>{partes}</span>;
};
