import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import { LinkDoTexto } from "~/features/conversa/components/LinkDoTexto";
import { Emoji } from "~/features/expressao/components/Emoji";
import { EMOJI } from "~/features/expressao/lib/twemoji";

import { BlocoDeCodigo } from "~/features/conversa/components/BlocoDeCodigo";
import type { ResolverMencoes } from "~/features/conversa/hooks/use-mencoes";
import { partirEmCodigo } from "~/features/conversa/lib/codigo";
import {
  partirEmAvisos,
  ROTULO_DO_AVISO,
  type TipoDeAviso,
} from "~/features/conversa/lib/avisos";
import { legivel } from "~/features/perfil/lib/contraste";
import { MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { EH_IMAGEM, LINK, limparLink, SO_UM_LINK } from "~/features/conversa/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { i18next, useTranslation } from "~/traducao";
import { cn } from "~/lib/utils";
import { flxCls, type Lugares } from "~/lib/compat-de-tema";

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
  <span data-gc="conversa.message-content.span"
    title={titulo}
    className={cn("rounded px-1 py-px font-medium", flxCls("mencao"))}
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

    partes.push(<Emoji data-gc="conversa.message-content.emoji" key={`${chave}-e${inicio}`} emoji={achado[0]} />);
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
          <img data-gc="conversa.message-content.img"
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
        <Pilula data-gc="conversa.message-content.pilula" key={k} cor={cargo?.color} titulo={i18next.t("conversa.mencao.cargo")}>
          @{cargo?.name ?? i18next.t("conversa.mencao.cargoSemNome")}
        </Pilula>
      );
    } else if (usuarioId) {
      pedaco = (
        <Pilula data-gc="conversa.message-content.pilula--2" key={k} titulo={i18next.t("conversa.mencao.pessoa")}>
          @{mencoes?.nomes.get(usuarioId) ?? i18next.t("conversa.mencao.alguem")}
        </Pilula>
      );
    } else if (todos) {
      pedaco = (
        <Pilula data-gc="conversa.message-content.pilula--3"
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

const COR_DO_AVISO: Record<TipoDeAviso, string> = {
  note: "var(--alert-note-color, var(--color-link))",
  tip: "var(--alert-tip-color, var(--color-online))",
  important: "var(--alert-important-color, var(--color-everyone))",
  warning: "var(--alert-warning-color, var(--color-aviso))",
  caution: "var(--alert-caution-color, var(--color-danger))",
};

const CLASSE_DO_AVISO: Record<TipoDeAviso, Lugares> = {
  note: "avisoNota",
  tip: "avisoDica",
  important: "avisoImportante",
  warning: "avisoAtencao",
  caution: "avisoCuidado",
};

const Aviso: React.FC<{ tipo: TipoDeAviso; children: React.ReactNode }> = ({
  tipo,
  children,
}) => (
  <div data-gc="conversa.message-content.div"
    className={cn(
      flxCls("avisoDoMarkdown"),
      flxCls(CLASSE_DO_AVISO[tipo]),
      "my-1 rounded border-l-2 py-1.5 pl-2.5 pr-2",
    )}
    style={{
      borderColor: COR_DO_AVISO[tipo],
      background: `color-mix(in srgb, ${COR_DO_AVISO[tipo]} 8%, transparent)`,
    }}
  >
    <p data-gc="conversa.message-content.p"
      className={cn(flxCls("tituloDoAviso"), "mb-0.5 text-xs font-semibold")}
      style={{ color: COR_DO_AVISO[tipo] }}
    >
      {ROTULO_DO_AVISO[tipo]}
    </p>
    <div data-gc="conversa.message-content.div--2" className={flxCls("corpoDoAviso")}>{children}</div>
  </div>
);

const Citacao: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.message-content.div--3" className={cn(flxCls("citacao"), "my-1 flex gap-2")}>
    <span data-gc="conversa.message-content.span--2"
      aria-hidden
      className={cn(flxCls("divisorDaCitacao"), "w-0.5 shrink-0 rounded-full bg-line")}
    />
    <div data-gc="conversa.message-content.div--4" className="min-w-0 flex-1 text-ink-muted">{children}</div>
  </div>
);

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
      <LinkDoTexto data-gc="conversa.message-content.link-do-texto" key={`${chave}-l${casamento.index}`} url={url} />,
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
      <button data-gc="conversa.message-content.button"
        onClick={() => abrirImagem(sozinho)}
        aria-label={i18next.t("conversa.cartao.verImagem")}
        className="mt-1 block overflow-hidden rounded transition hover:brightness-110"
      >
        <img data-gc="conversa.message-content.img--2"
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
      for (const [j, trecho] of partirEmAvisos(pedaco.texto).entries()) {
        const dentro = corrido(trecho.texto, porNome, `t${i}-${j}`, mencoes);

        if (trecho.tipo === "texto") {
          partes.push(...dentro);
          continue;
        }

        temPainel = true;

        partes.push(
          trecho.tipo === "aviso" ? (
            <Aviso data-gc="conversa.message-content.aviso" key={`a${i}-${j}`} tipo={trecho.aviso}>
              {dentro}
            </Aviso>
          ) : (
            <Citacao data-gc="conversa.message-content.citacao" key={`q${i}-${j}`}>{dentro}</Citacao>
          ),
        );
      }

      return;
    }

    if (pedaco.tipo === "linha" || !blocos) {
      const codigo =
        pedaco.tipo === "linha" ? pedaco.codigo : pedaco.codigo.replace(/\s*\n\s*/g, " ");

      partes.push(
        <code data-gc="conversa.message-content.code" key={`c${i}`} className={cn("rounded bg-codigo px-1 py-px font-mono text-[0.9em]", flxCls("codigoEmLinha"))}>
          {codigo}
        </code>,
      );
      return;
    }

    temPainel = true;
    partes.push(<BlocoDeCodigo data-gc="conversa.message-content.bloco-de-codigo" key={`b${i}`} codigo={pedaco.codigo} lingua={pedaco.lingua} />);
  });

  if (temPainel)
    return (
      <div data-gc="conversa.message-content.div--5" className={cn(flxCls("textoMarcado"), className)}>
        {partes}
      </div>
    );

  return (
    <span data-gc="conversa.message-content.span--3" className={cn(flxCls("textoMarcado"), className)}>
      {partes}
    </span>
  );
};
