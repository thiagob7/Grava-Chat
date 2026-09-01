import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import { BlocoDeCodigo } from "~/components/BlocoDeCodigo";
import type { ResolverMencoes } from "~/hooks/use-mencoes";
import { partirEmCodigo } from "~/lib/codigo";
import { legivel } from "~/lib/cosmeticos/contraste";
import { MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { EH_IMAGEM, LINK, limparLink, SO_UM_LINK } from "~/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/stores/aparencia";

const RICO = /:([a-zA-Z0-9_]{2,32}):|<@&([a-f\d]{24})>|<@([a-f\d]{24})>|@(everyone|here)\b/g;

interface MessageContentProps {
  content: string;
  emojis: GuildEmoji[];
  className?: string;
  mencoes?: ResolverMencoes;
  /**
   * Desenha as cercas como painel — com a lingua no alto e o botao de copiar.
   * Fica desligado por padrao porque a busca, as favoritas e a citacao mostram
   * a mensagem numa linha so: ali o painel estouraria o cartao, e o codigo vai
   * em `<code>` mesmo, no meio do texto.
   */
  blocos?: boolean;
}

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

/// Links, emojis e menções: o texto que sobra depois de tirar o código.
function corrido(
  texto: string,
  porNome: Map<string, GuildEmoji>,
  chave: string,
  mencoes?: ResolverMencoes,
) {
  const partes: React.ReactNode[] = [];
  let ultimo = 0;

  for (const casamento of texto.matchAll(LINK)) {
    if (casamento.index === undefined) continue;

    const url = limparLink(casamento[0]);
    if (casamento.index > ultimo) {
      partes.push(...enriquecer(texto.slice(ultimo, casamento.index), porNome, `${chave}-${ultimo}`, mencoes));
    }

    partes.push(
      <a
        key={`${chave}-l${casamento.index}`}
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="text-brand hover:underline"
      >
        {url}
      </a>,
    );

    ultimo = casamento.index + url.length;
  }

  if (ultimo < texto.length) {
    partes.push(...enriquecer(texto.slice(ultimo), porNome, `${chave}-${ultimo}`, mencoes));
  }

  return partes;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  emojis,
  className,
  mencoes,
  blocos = false,
}) => {
  const abrirImagem = useLightbox((s) => s.abrir);
  const abrirImagensDeLinks = useAparencia((s) => s.imagensDeLinks);

  if (!content) return null;

  const sozinho = content.trim();
  if (abrirImagensDeLinks && SO_UM_LINK.test(sozinho) && EH_IMAGEM.test(limparLink(sozinho))) {
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
          /// `min()` porque o teto de 420px também tem que respeitar a coluna:
          /// no painel estreito quem manda é o 100%.
          style={{ maxWidth: `min(${MAX_IMAGEM_W}px, 100%)`, maxHeight: MAX_IMAGEM_H }}
          className="block h-auto w-auto object-contain"
        />
      </button>
    );
  }

  const porNome = new Map(emojis.map((e) => [e.name, e]));
  const pedacos = partirEmCodigo(content);
  const partes: React.ReactNode[] = [];
  let temPainel = false;

  pedacos.forEach((pedaco, i) => {
    if (pedaco.tipo === "texto") {
      partes.push(...corrido(pedaco.texto, porNome, `t${i}`, mencoes));
      return;
    }

    /// `assim` no meio da frase, e a cerca quando o painel esta desligado:
    /// nada de moldura, so a fonte e o fundo. A cerca perde as quebras porque
    /// quem nao pediu painel mostra a mensagem numa linha so.
    if (pedaco.tipo === "linha" || !blocos) {
      const codigo =
        pedaco.tipo === "linha" ? pedaco.codigo : pedaco.codigo.replace(/\s*\n\s*/g, " ");

      partes.push(
        <code key={`c${i}`} className="rounded bg-surface-2 px-1 py-px font-mono text-[0.9em]">
          {codigo}
        </code>,
      );
      return;
    }

    temPainel = true;
    partes.push(<BlocoDeCodigo key={`b${i}`} codigo={pedaco.codigo} lingua={pedaco.lingua} />);
  });

  /// `<div>` so quando ha painel: um bloco dentro do `<span>` da citacao (ou
  /// de qualquer linha) fecharia o paragrafo a forca no navegador.
  if (temPainel) return <div className={className}>{partes}</div>;

  return <span className={className}>{partes}</span>;
};
