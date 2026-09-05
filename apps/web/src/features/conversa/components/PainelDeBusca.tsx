import React from "react";
import { Search, X } from "lucide-react";

import { useBuscarMensagens } from "~/@core/application/queries/message/use-buscar-mensagens";
import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import type { ResultadoDaBusca } from "~/@core/application/requests/message/buscar-mensagens";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { useEnfeites } from "~/features/perfil/hooks/use-enfeites";
import { useMencoes } from "~/features/conversa/hooks/use-mencoes";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { formatTimestamp } from "~/lib/format";
import type { GuildEmoji } from "@gravae/shared";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-fluxer";

interface PainelDeBuscaProps {
  /// Ausente quando a busca é dentro de uma conversa.
  guildId?: string;
  canalId?: string;
  termo: string;
  currentUserId?: string;
  onFechar: () => void;
  onIr: (channelId: string, messageId: string) => void;
}

export const PainelDeBusca: React.FC<PainelDeBuscaProps> = ({
  guildId,
  canalId,
  termo,
  currentUserId,
  onFechar,
  onIr,
}) => {
  const { t } = useTranslation();
  const busca = useBuscarMensagens({ guildId, canalId, termo });
  const { data: expressoes } = useFindExpressions(guildId);
  const enfeitesDe = useEnfeites(guildId);
  const mencoes = useMencoes(guildId, false, currentUserId);

  const resultados = busca.data?.pages.flatMap((p) => p.messages) ?? [];
  const total = resultados.length;

  return (
    <aside data-gc="conversa.painel-de-busca.aside" {...flx("painelDeBusca", "hidden w-96 shrink-0 flex-col border-l border-divisor bg-surface-1 lg:flex")}>
      <header data-gc="conversa.painel-de-busca.header" className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4">
        <Search data-gc="conversa.painel-de-busca.search" size={16} className="shrink-0 text-ink-faint" />
        <h2 data-gc="conversa.painel-de-busca.h2" className="min-w-0 flex-1 truncate text-sm font-semibold">
          {busca.isLoading
            ? t("conversa.busca.procurando")
            : 
              t(total === 1 ? "conversa.busca.resultado" : "conversa.busca.resultados", {
                quantos: `${total}${busca.hasNextPage ? "+" : ""}`,
              })}
        </h2>
        <button data-gc="conversa.painel-de-busca.button.on-fechar"
          onClick={onFechar}
          aria-label={t("conversa.busca.fechar")}
          className="text-ink-muted transition hover:text-ink"
        >
          <X data-gc="conversa.painel-de-busca.x" size={18} />
        </button>
      </header>

      <div data-gc="conversa.painel-de-busca.div" {...flx("resultadosDaBusca", "min-h-0 flex-1 overflow-y-auto p-3")}>
        {!busca.isLoading && !total && (
          <p data-gc="conversa.painel-de-busca.p" className="px-2 py-8 text-center text-sm text-ink-muted">
            {t("conversa.busca.nadaCom", { termo })}
            <span data-gc="conversa.painel-de-busca.span" className="mt-1 block text-xs text-ink-faint">
              {t("conversa.busca.soOsQuePodeLer")}
            </span>
          </p>
        )}

        <div data-gc="conversa.painel-de-busca.div--2" className="flex flex-col gap-2">
          {resultados.map((resultado) => (
            <Resultado data-gc="conversa.painel-de-busca.resultado"
              key={resultado.id}
              resultado={resultado}
              termo={termo}
              emojis={expressoes.emojis}
              enfeites={enfeitesDe(resultado.author.id)}
              mencoes={mencoes}
              onIr={() => onIr(resultado.channelId, resultado.id)}
            />
          ))}
        </div>

        {busca.hasNextPage && (
          <button data-gc="conversa.painel-de-busca.button"
            onClick={() => void busca.fetchNextPage()}
            disabled={busca.isFetchingNextPage}
            className="mt-3 w-full rounded bg-surface-3 py-2 text-xs text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
          >
            {busca.isFetchingNextPage ? "Carregando…" : "Mostrar mais"}
          </button>
        )}
      </div>
    </aside>
  );
};

const Resultado: React.FC<{
  resultado: ResultadoDaBusca;
  termo: string;
  emojis: GuildEmoji[];
  enfeites: ReturnType<ReturnType<typeof useEnfeites>>;
  mencoes: ReturnType<typeof useMencoes>;
  onIr: () => void;
}> = ({ resultado, termo, emojis, enfeites, mencoes, onIr }) => (
  <button data-gc="conversa.painel-de-busca.button.on-ir"
    onClick={onIr}
    {...flx("itemDoResultado", "block w-full rounded border border-transparent bg-surface-2 p-3 text-left transition hover:border-line hover:bg-surface-3")}
  >
    <p data-gc="conversa.painel-de-busca.p--2" className="mb-1.5 flex items-center gap-1 text-xs text-ink-faint">
      <span data-gc="conversa.painel-de-busca.span--2" className="min-w-0 truncate">#{resultado.channelName}</span>
      <span data-gc="conversa.painel-de-busca.span--3" aria-hidden>·</span>
      <span data-gc="conversa.painel-de-busca.span--4" className="shrink-0">{formatTimestamp(resultado.createdAt)}</span>
    </p>

    <div data-gc="conversa.painel-de-busca.div--3" className="flex gap-2">
      <Avatar data-gc="conversa.painel-de-busca.avatar"
        id={resultado.author.id}
        name={resultado.author.displayName}
        url={resultado.author.avatarUrl}
        size={24}
      />

      <div data-gc="conversa.painel-de-busca.div--4" className="min-w-0 flex-1">
        <UserName data-gc="conversa.painel-de-busca.user-name"
          nome={resultado.author.displayName}
          perfil={enfeites?.perfil}
          corDoCargo={enfeites?.corDoCargo}
          ehBot={resultado.author.isBot}
          className="text-sm font-medium"
        />

        <p data-gc="conversa.painel-de-busca.p--3" className="mt-0.5 line-clamp-4 whitespace-pre-wrap break-words text-sm text-ink-muted">
          <MessageContent data-gc="conversa.painel-de-busca.message-content" content={trechoEmVolta(resultado.content, termo)} emojis={emojis} mencoes={mencoes} />
        </p>
      </div>
    </div>
  </button>
);

const MARGEM = 90;

function trechoEmVolta(conteudo: string, termo: string) {
  const onde = conteudo.toLowerCase().indexOf(termo.toLowerCase());
  if (onde < 0 || conteudo.length <= MARGEM * 2) return conteudo;

  const inicio = Math.max(0, onde - MARGEM);
  const fim = Math.min(conteudo.length, onde + termo.length + MARGEM);

  return `${inicio > 0 ? "…" : ""}${conteudo.slice(inicio, fim)}${fim < conteudo.length ? "…" : ""}`;
}
