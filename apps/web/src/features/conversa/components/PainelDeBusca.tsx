import React from "react";
import { Search, X } from "lucide-react";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useSearchMessages } from "~/@core/application/queries/message/use-buscar-mensagens";
import type { SearchScope, SearchFilters } from "~/@core/application/requests/message/buscar-mensagens";
import { parseSearch, hasSearch } from "~/features/conversa/lib/busca";
import { useFindExpressions } from "~/@core/application/queries/expression/use-expressions";
import type { SearchResult } from "~/@core/application/requests/message/buscar-mensagens";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { useCharms } from "~/features/perfil/hooks/use-enfeites";
import { useMentions } from "~/features/conversa/hooks/use-mencoes";
import { MessageContent } from "~/features/conversa/components/MessageContent";
import { formatTimestamp } from "~/lib/format";
import type { GuildEmoji } from "@gravae/shared";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";

interface SearchPropsPanel {
  guildId?: string;
  channelId?: string;
  term: string;
  scope?: SearchScope;
  currentUserId?: string;
  onClose: () => void;
  onIr: (channelId: string, messageId: string) => void;
}

export const SearchPanel: React.FC<SearchPropsPanel> = ({
  guildId,
  channelId,
  term,
  scope,
  currentUserId,
  onClose,
  onIr,
}) => {
  const { t } = useTranslation();
  const { data: detail } = useFindGuild(guildId);

  const read = parseSearch(term);
  const memberByName = (name?: string) => {
    if (!name) return undefined;
    const down = name.toLowerCase();
    return detail?.members.find(
      (m) => m.user.username.toLowerCase() === down || m.user.displayName.toLowerCase() === down,
    )?.user.id;
  };
  const channelByName = (name?: string) =>
    name ? detail?.channels.find((c) => c.name.toLowerCase() === name.toLowerCase())?.id : undefined;

  const filters: SearchFilters = {
    term: read.term,
    scope,
    guildId,
    channelId: channelByName(read.in) ?? channelId,
    authorId: memberByName(read.from),
    mentionsId: memberByName(read.mentions),
    has: read.has,
    after: read.after,
    before: read.before,
    em: read.on,
    pinned: read.pinned,
    authorKind: read.authorType,
    order: read.sort,
  };

  const search = useSearchMessages(filters, hasSearch(read));
  const { data: expressions } = useFindExpressions(guildId);
  const charms = useCharms(guildId);
  const mentions = useMentions(guildId, false, currentUserId);

  const results = search.data?.pages.flatMap((p) => p.messages) ?? [];
  const total = results.length;

  return (
    <aside data-gc="conversa.painel-de-busca.aside" {...flx("searchPanel", "hidden w-96 shrink-0 flex-col border-l border-divisor bg-surface-1 lg:flex")}>
      <header data-gc="conversa.painel-de-busca.header" className="flex h-12 shrink-0 items-center gap-2 border-b border-divisor px-4">
        <Search data-gc="conversa.painel-de-busca.search" size={16} className="shrink-0 text-ink-faint" />
        <h2 data-gc="conversa.painel-de-busca.h2" className="min-w-0 flex-1 truncate text-sm font-semibold">
          {search.isLoading
            ? t("conversa.busca.procurando")
            : 
              t(total === 1 ? "conversa.busca.resultado" : "conversa.busca.resultados", {
                quantos: `${total}${search.hasNextPage ? "+" : ""}`,
              })}
        </h2>
        <button data-gc="conversa.painel-de-busca.button.on-close"
          onClick={onClose}
          aria-label={t("conversa.busca.fechar")}
          className="text-ink-muted transition hover:text-ink"
        >
          <X data-gc="conversa.painel-de-busca.x" size={18} />
        </button>
      </header>

      <div data-gc="conversa.painel-de-busca.div" {...flx("searchResults", "min-h-0 flex-1 overflow-y-auto p-3")}>
        {!search.isLoading && !total && (
          <p data-gc="conversa.painel-de-busca.p" className="px-2 py-8 text-center text-sm text-ink-muted">
            {t("conversa.busca.nadaCom", { termo: read.term || term })}
            <span data-gc="conversa.painel-de-busca.span" className="mt-1 block text-xs text-ink-faint">
              {t("conversa.busca.soOsQuePodeLer")}
            </span>
          </p>
        )}

        <div data-gc="conversa.painel-de-busca.div--2" className="flex flex-col gap-2">
          {results.map((result) => (
            <Result data-gc="conversa.painel-de-busca.result"
              key={result.id}
              result={result}
              term={read.term}
              emojis={expressions.emojis}
              charms={charms(result.author.id)}
              mentions={mentions}
              onIr={() => onIr(result.channelId, result.id)}
            />
          ))}
        </div>

        {search.hasNextPage && (
          <button data-gc="conversa.painel-de-busca.button"
            onClick={() => void search.fetchNextPage()}
            disabled={search.isFetchingNextPage}
            className="mt-3 w-full rounded bg-surface-3 py-2 text-xs text-ink-muted transition hover:bg-surface-4 hover:text-ink disabled:opacity-50"
          >
            {search.isFetchingNextPage ? "Carregando…" : "Mostrar mais"}
          </button>
        )}
      </div>
    </aside>
  );
};

const Result: React.FC<{
  result: SearchResult;
  term: string;
  emojis: GuildEmoji[];
  charms: ReturnType<ReturnType<typeof useCharms>>;
  mentions: ReturnType<typeof useMentions>;
  onIr: () => void;
}> = ({ result, term, emojis, charms, mentions, onIr }) => (
  <button data-gc="conversa.painel-de-busca.button.on-ir"
    onClick={onIr}
    {...flx("resultItem", "block w-full rounded border border-transparent bg-surface-2 p-3 text-left transition hover:border-line hover:bg-surface-3")}
  >
    <p data-gc="conversa.painel-de-busca.p--2" className="mb-1.5 flex items-center gap-1 text-xs text-ink-faint">
      <span data-gc="conversa.painel-de-busca.span--2" className="min-w-0 truncate">
        {result.channelName ? `#${result.channelName}` : "Conversa"}
      </span>
      <span data-gc="conversa.painel-de-busca.span--3" aria-hidden>·</span>
      <span data-gc="conversa.painel-de-busca.span--4" className="shrink-0">{formatTimestamp(result.createdAt)}</span>
    </p>

    <div data-gc="conversa.painel-de-busca.div--3" className="flex gap-2">
      <Avatar data-gc="conversa.painel-de-busca.avatar"
        id={result.author.id}
        name={result.author.displayName}
        url={result.author.avatarUrl}
        size={24}
      />

      <div data-gc="conversa.painel-de-busca.div--4" className="min-w-0 flex-1">
        <UserName data-gc="conversa.painel-de-busca.user-name"
          name={result.author.displayName}
          profile={charms?.profile}
          roleColor={charms?.roleColor}
          isBot={result.author.isBot}
          isSystem={result.author.system}
          className="text-sm font-medium"
        />

        <p data-gc="conversa.painel-de-busca.p--3" className="mt-0.5 line-clamp-4 whitespace-pre-wrap break-words text-sm text-ink-muted">
          <MessageContent data-gc="conversa.painel-de-busca.message-content" content={snippetBack(result.content, term)} emojis={emojis} mentions={mentions} />
        </p>
      </div>
    </div>
  </button>
);

const MARGIN = 90;

function snippetBack(content: string, term: string) {
  if (!term) return content;
  const where = content.toLowerCase().indexOf(term.toLowerCase());
  if (where < 0 || content.length <= MARGIN * 2) return content;

  const start = Math.max(0, where - MARGIN);
  const end = Math.min(content.length, where + term.length + MARGIN);

  return `${start > 0 ? "…" : ""}${content.slice(start, end)}${end < content.length ? "…" : ""}`;
}
