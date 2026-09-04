import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import { Emoji } from "~/components/Emoji";
import { EMOJI } from "~/lib/twemoji";

import { BlocoDeCodigo } from "~/components/BlocoDeCodigo";
import type { ResolverMencoes } from "~/hooks/use-mencoes";
import { partirEmCodigo } from "~/lib/codigo";
import { legivel } from "~/lib/cosmeticos/contraste";
import { MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { EH_IMAGEM, LINK, limparLink, SO_UM_LINK } from "~/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/stores/aparencia";
import { i18next, useTranslation } from "~/traducao";

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

/**
 * A pílula de menção.
 *
 * Três famílias, porque são três coisas diferentes: pessoa e
 * cargo em azul (ou na cor do cargo, quando ele tem uma), `@everyone` em roxo
 * e `@here` em âmbar. A borda fina é o que separa a pílula do texto sem
 * precisar de fundo forte.
 */
const Pilula: React.FC<{
  children: React.ReactNode;
  cor?: string | null;
  titulo?: string;
  familia?: "mencao" | "everyone" | "here";
}> = ({ children, cor, titulo, familia = "mencao" }) => (
  <span
    title={titulo}
    className="rounded px-1 py-px font-medium"
    /*
      Fundo tingido e nada de borda. A borda que estava aqui dava ar de botão —
      no meio de uma frase, uma pílula com contorno parecia clicável e roubava
      a linha inteira. O tom do fundo é o que basta pra dizer "isto é menção".
    */
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

/*
  Troca os emoji do texto pelo desenho do Twemoji.

  Roda sobre os PEDAÇOS DE TEXTO que sobram depois do `enriquecer` — nunca sobre
  o texto cru com marcação dentro. Assim ele não tem chance de encostar num
  `:nome:` de emoji do servidor nem no miolo de uma menção, que já viraram
  elementos antes de chegar aqui.

  Volta o texto intacto quando não há emoji nenhum: a esmagadora maioria das
  mensagens não tem, e devolver um vetor de um item só para cada linha de
  conversa seria trabalho de React à toa.
*/
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
  /*
    O `t` aqui é a inscrição, não o tradutor.

    Quem traduz as pílulas de menção é o `i18next.t` lá dentro do `enriquecer`,
    que não é componente e não tem hook. Sem esta linha, o texto delas só
    trocaria de idioma quando a mensagem redesenhasse por outro motivo.
  */
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
        <code key={`c${i}`} className="rounded bg-codigo px-1 py-px font-mono text-[0.9em]">
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
