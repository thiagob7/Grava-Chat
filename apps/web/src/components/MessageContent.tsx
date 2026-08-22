import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import type { ResolverMencoes } from "~/hooks/use-mencoes";
import { legivel } from "~/lib/cosmeticos/contraste";
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
/**
 * Emoji do servidor e as três formas de menção, num regex só.
 *
 * Numa passada só porque as regras precisam competir pela mesma posição do
 * texto: com dois laços, o segundo receberia pedaços já fatiados pelo primeiro
 * e uma menção partida ao meio viraria texto cru — que é exatamente o que
 * acontecia até aqui, com `<@id>` aparecendo escrito na tela.
 */
const RICO = /:([a-zA-Z0-9_]{2,32}):|<@&([a-f\d]{24})>|<@([a-f\d]{24})>|@(everyone|here)\b/g;
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
  /**
   * De onde tirar o nome de quem foi mencionado. Vem de fora porque isto aqui
   * renderiza cinquenta vezes por página: o cruzamento acontece uma vez na
   * lista, não uma vez por mensagem.
   */
  mencoes?: ResolverMencoes;
}

/** A menção desenhada: um pedacinho clicável, destacado do texto em volta. */
const Pilula: React.FC<{ children: React.ReactNode; cor?: string | null; titulo?: string }> = ({
  children,
  cor,
  titulo,
}) => (
  <span
    title={titulo}
    className="rounded px-1 py-px font-medium"
    style={
      cor
        ? { color: legivel(cor), backgroundColor: `${legivel(cor)}22` }
        : { color: "var(--color-brand)", backgroundColor: "color-mix(in oklab, var(--color-brand), transparent 82%)" }
    }
  >
    {children}
  </span>
);

/**
 * Troca `:nome:` pelos emojis do servidor e as menções pelo nome de quem foi
 * mencionado. Só texto entra aqui — link, não.
 *
 * O que fica gravado no banco é sempre o id (`<@…>`), nunca o nome: quem troca
 * de apelido não quebra mensagem antiga, e ninguém consegue escrever à mão uma
 * menção que parece ser de outra pessoa.
 */
function enriquecer(
  texto: string,
  porNome: Map<string, GuildEmoji>,
  chave: string,
  mencoes?: ResolverMencoes,
) {
  const partes: React.ReactNode[] = [];
  let ultimo = 0;

  for (const casamento of texto.matchAll(RICO)) {
    const [inteiro, emoji, cargoId, usuarioId, todos] = casamento;
    if (casamento.index === undefined) continue;

    const anterior = texto.slice(ultimo, casamento.index);
    let pedaco: React.ReactNode = null;
    const k = `${chave}-${casamento.index}`;

    if (emoji) {
      const encontrado = porNome.get(emoji);
      if (encontrado) {
        pedaco = (
          <img
            key={k}
            src={encontrado.url}
            alt={`:${encontrado.name}:`}
            title={`:${encontrado.name}:`}
            className="inline-block size-6 align-text-bottom"
          />
        );
      }
    } else if (cargoId) {
      const cargo = mencoes?.cargos.get(cargoId);
      // cargo apagado vira texto neutro em vez de sumir: a mensagem continua
      // fazendo sentido pra quem lê o histórico
      pedaco = (
        <Pilula key={k} cor={cargo?.color} titulo="Menção de cargo">
          @{cargo?.name ?? "cargo"}
        </Pilula>
      );
    } else if (usuarioId) {
      pedaco = (
        <Pilula key={k} titulo="Menção">
          @{mencoes?.nomes.get(usuarioId) ?? "alguém"}
        </Pilula>
      );
    } else if (todos) {
      pedaco = (
        <Pilula key={k} titulo={todos === "here" ? "Notifica quem está online" : "Notifica o servidor"}>
          @{todos}
        </Pilula>
      );
    }

    if (!pedaco) continue;

    if (anterior) partes.push(anterior);
    partes.push(pedaco);
    ultimo = casamento.index + inteiro.length;
  }

  if (!partes.length) return [texto];
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));

  return partes;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  emojis,
  className,
  mencoes,
}) => {
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
      partes.push(...enriquecer(content.slice(ultimo, casamento.index), porNome, `t${ultimo}`, mencoes));
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
    partes.push(...enriquecer(content.slice(ultimo), porNome, `t${ultimo}`, mencoes));
  }

  return <span className={className}>{partes}</span>;
};
