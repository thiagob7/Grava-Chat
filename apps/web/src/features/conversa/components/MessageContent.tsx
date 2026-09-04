import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import { Emoji } from "~/features/expressao/components/Emoji";
import { EMOJI } from "~/features/expressao/lib/twemoji";

import { BlocoDeCodigo } from "~/features/conversa/components/BlocoDeCodigo";
import type { ResolverMencoes } from "~/features/conversa/hooks/use-mencoes";
import { partirEmCodigo } from "~/features/conversa/lib/codigo";
import { legivel } from "~/features/perfil/lib/contraste";
import { MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { EH_IMAGEM, LINK, limparLink, SO_UM_LINK } from "~/features/conversa/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/stores/aparencia";
import { i18next, useTranslation } from "~/traducao";

const RICO = /:([a-zA-Z0-9_]{2,32}):|<@&([a-f\d]{24})>|<@([a-f\d]{24})>|@(everyone|here)\b/g;

interface MessageContentProps {
  content: string;
  emojis: GuildEmoji[];
  className?: string;
  mencoes?: ResolverMencoes;
  blocos?: boolean;
}

const Pilula: React.FC<{
  children: React.ReactNode;
  cor?: string | null;
  titulo?: string;
  familia?: "mencao" | "everyone" | "here";
}> = ({ children, cor, titulo, familia = "mencao" }) => (
  <span
    title={titulo}
    className="rounded px-1 py-px font-medium"
    style={
      cor
        ? { color: legivel(cor), backgroundColor: `${legivel(cor)}26` }
        : {
            color: `var(--color-${familia})`,
            backgroundColor: `color-mix(in srgb, var(--color-${familia}) 15%, transparent)`,
          }
    }
  >
    {children}
  </span>
);

function comTwemoji(texto: string, chave: string): React.ReactNode[] {
  const achados = [...texto.matchAll(EMOJI)];
  if (!achados.length) return [texto];

  const partes: React.ReactNode[] = [];
  let ultimo = 0;

  for (const achado of achados) {
    const inicio = achado.index!;
    if (inicio > ultimo) partes.push(texto.slice(ultimo, inicio));

    partes.push(<Emoji key={`${chave}-e${inicio}`} emoji={achado[0]} />);
    ultimo = inicio + achado[0].length;
  }

  if (ultimo < texto.length) partes.push(texto.slice(ultimo));

  return partes;
}

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
        <Pilula key={k} cor={cargo?.color} titulo={i18next.t("conversa.mencao.cargo")}>
          @{cargo?.name ?? i18next.t("conversa.mencao.cargoSemNome")}
        </Pilula>
      );
    } else if (usuarioId) {
      pedaco = (
        <Pilula key={k} titulo={i18next.t("conversa.mencao.pessoa")}>
          @{mencoes?.nomes.get(usuarioId) ?? i18next.t("conversa.mencao.alguem")}
        </Pilula>
      );
    } else if (todos) {
      pedaco = (
        <Pilula
          key={k}
          familia={todos === "here" ? "here" : "everyone"}
          titulo={i18next.t(
            todos === "here" ? "conversa.mencao.here" : "conversa.mencao.everyone",
          )}
        >
          @{todos}
        </Pilula>
      );
    }

    if (!pedaco) continue;

    if (anterior) partes.push(...comTwemoji(anterior, `${k}-a`));
    partes.push(pedaco);
    ultimo = casamento.index + inteiro.length;
  }

  if (!partes.length) return comTwemoji(texto, chave);
  if (ultimo < texto.length) partes.push(...comTwemoji(texto.slice(ultimo), `${chave}-f`));

  return partes;
}

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
        className="text-link hover:underline"
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
  useTranslation();

  const abrirImagem = useLightbox((s) => s.abrir);
  const abrirImagensDeLinks = useAparencia((s) => s.imagensDeLinks);

  if (!content) return null;

  const sozinho = content.trim();
  if (abrirImagensDeLinks && SO_UM_LINK.test(sozinho) && EH_IMAGEM.test(limparLink(sozinho))) {
    return (
      <button
        onClick={() => abrirImagem(sozinho)}
        aria-label={i18next.t("conversa.cartao.verImagem")}
        className="mt-1 block overflow-hidden rounded transition hover:brightness-110"
      >
        <img
          src={sozinho}
          alt=""
          loading="lazy"
          decoding="async"
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

    if (pedaco.tipo === "linha" || !blocos) {
      const codigo =
        pedaco.tipo === "linha" ? pedaco.codigo : pedaco.codigo.replace(/\s*\n\s*/g, " ");

      partes.push(
        <code key={`c${i}`} className="rounded bg-codigo px-1 py-px font-mono text-[0.9em]">
          {codigo}
        </code>,
      );
      return;
    }

    temPainel = true;
    partes.push(<BlocoDeCodigo key={`b${i}`} codigo={pedaco.codigo} lingua={pedaco.lingua} />);
  });

  if (temPainel) return <div className={className}>{partes}</div>;

  return <span className={className}>{partes}</span>;
};
