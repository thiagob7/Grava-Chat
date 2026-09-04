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

interface PainelDeBuscaProps {
  guildId: string;
  termo: string;
  currentUserId?: string;
  onFechar: () => void;
  onIr: (channelId: string, messageId: string) => void;
}

export const PainelDeBusca: React.FC<PainelDeBuscaProps> = ({
  guildId,
  termo,
  currentUserId,
  onFechar,
  onIr,
}) => {
  const { t } = useTranslation();
  const busca = useBuscarMensagens({ guildId, termo });
  const { data: expressoes } = useFindExpressions(guildId);
  const enfeitesDe = useEnfeites(guildId);
  const mencoes = useMencoes(guildId, false, currentUserId);

  const resultados = busca.data?.pages.flatMap((p) => p.messages) ?? [];
  const total = resultados.length;

  return (
    <aside className="hidden w-96 shrink-0 flex-col border-l border-divisor bg-surface-1 lg:flex">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4">
        <Search size={16} className="shrink-0 text-ink-faint" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold">
          {busca.isLoading
            ? t("conversa.busca.procurando")
            : 
              t(total === 1 ? "conversa.busca.resultado" : "conversa.busca.resultados", {
                quantos: `${total}${busca.hasNextPage ? "+" : ""}`,
              })}
        </h2>
        <button
          onClick={onFechar}
          aria-label={t("conversa.busca.fechar")}
          className="text-ink-muted transition hover:text-ink"
        >
          <X size={18} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {!busca.isLoading && !total && (
          <p className="px-2 py-8 text-center text-sm text-ink-muted">
            {t("conversa.busca.nadaCom", { termo })}
            <span className="mt-1 block text-xs text-ink-faint">
              {t("conversa.busca.soOsQuePodeLer")}
            </span>
          </p>
        )}

        <div className="flex flex-col gap-2">
          {resultados.map((resultado) => (
            <Resultado
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
          <button
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
  <button
    onClick={onIr}
    className="block w-full rounded border border-transparent bg-surface-2 p-3 text-left transition hover:border-line hover:bg-surface-3"
  >
    <p className="mb-1.5 flex items-center gap-1 text-xs text-ink-faint">
      <span className="min-w-0 truncate">#{resultado.channelName}</span>
      <span aria-hidden>·</span>
      <span className="shrink-0">{formatTimestamp(resultado.createdAt)}</span>
    </p>

    <div className="flex gap-2">
      <Avatar
        id={resultado.author.id}
        name={resultado.author.displayName}
        url={resultado.author.avatarUrl}
        size={24}
      />

      <div className="min-w-0 flex-1">
        <UserName
          nome={resultado.author.displayName}
          perfil={enfeites?.perfil}
          corDoCargo={enfeites?.corDoCargo}
          ehBot={resultado.author.isBot}
          className="text-sm font-medium"
        />

        <p className="mt-0.5 line-clamp-4 whitespace-pre-wrap break-words text-sm text-ink-muted">
          <MessageContent content={trechoEmVolta(resultado.content, termo)} emojis={emojis} mencoes={mencoes} />
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
