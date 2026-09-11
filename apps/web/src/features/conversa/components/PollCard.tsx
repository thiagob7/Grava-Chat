import React from "react";
import { BarChart3, Check } from "lucide-react";
import type { Poll } from "@gravae/shared";

import { closePoll, votePoll } from "~/@core/lib/websocket/emit-message-actions";
import { cn } from "~/lib/utils";
import { currentLanguage, useTranslation } from "~/traducao";

interface PollCardProps {
  messageId: string;
  poll: Poll;
  currentUserId: string | undefined;
  isAuthor: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ messageId, poll, currentUserId, isAuthor }) => {
  const { t } = useTranslation();
  const total = poll.options.reduce((soma, o) => soma + o.userIds.length, 0);
  const expired = Boolean(poll.expiresAt && new Date(poll.expiresAt) < new Date());
  const ended = Boolean(poll.closedAt) || expired;

  const moreVoted = Math.max(...poll.options.map((o) => o.userIds.length), 0);

  return (
    <div data-gc="conversa.poll-card.div" className="mt-1 max-w-md rounded-lg border border-line bg-surface-1 p-4">
      <p data-gc="conversa.poll-card.p" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <BarChart3 data-gc="conversa.poll-card.bar-chart3" size={13} />
        {t(
          ended
            ? "conversa.enquete.encerrada"
            : poll.multiSelect
              ? "conversa.enquete.variasRespostas"
              : "conversa.enquete.titulo",
        )}
      </p>

      <p data-gc="conversa.poll-card.p--2" className="mt-1.5 font-semibold">{poll.question}</p>

      <div data-gc="conversa.poll-card.div--2" className="mt-3 space-y-2">
        {poll.options.map((option) => {
          const votes = option.userIds.length;
          const eu = currentUserId ? option.userIds.includes(currentUserId) : false;
          const percent = total ? Math.round((votes / total) * 100) : 0;
          const expiring = ended && votes > 0 && votes === moreVoted;

          return (
            <button data-gc="conversa.poll-card.button"
              key={option.id}
              disabled={ended}
              onClick={() => void votePoll(messageId, option.id).catch(() => undefined)}
              className={cn(
                "relative block w-full overflow-hidden rounded border px-3 py-2 text-left text-sm transition",
                eu ? "border-brand" : "border-line",
                !ended && "hover:border-ink-faint",
                ended && "cursor-default",
              )}
            >
              <span data-gc="conversa.poll-card.span"
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width]",
                  expiring ? "bg-online/25" : eu ? "bg-brand/20" : "bg-surface-3",
                )}
                style={{ width: `${percent}%` }}
              />

              <span data-gc="conversa.poll-card.span--2" className="relative flex items-center gap-2">
                {eu && <Check data-gc="conversa.poll-card.check" size={14} className="shrink-0 text-brand" />}
                <span data-gc="conversa.poll-card.span--3" className="min-w-0 flex-1 truncate">{option.text}</span>
                <span data-gc="conversa.poll-card.span--4" className="shrink-0 text-xs text-ink-faint">
                  {t(votes === 1 ? "conversa.enquete.umVoto" : "conversa.enquete.votos", {
                    quantidade: votes,
                  })}{" "}
                  · {percent}%
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div data-gc="conversa.poll-card.div--3" className="mt-3 flex items-center gap-3 text-xs text-ink-faint">
        <span data-gc="conversa.poll-card.span--5">
          {t(total === 1 ? "conversa.enquete.umVotoNoTotal" : "conversa.enquete.votosNoTotal", {
            quantidade: total,
          })}
        </span>

        {!ended && poll.expiresAt && (
          <span data-gc="conversa.poll-card.span--6">
            ·{" "}
            {t("conversa.enquete.encerraEm", {
              quando: new Intl.DateTimeFormat(currentLanguage(), {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(poll.expiresAt)),
            })}
          </span>
        )}

        {!ended && isAuthor && (
          <button data-gc="conversa.poll-card.button--2"
            onClick={() => void closePoll(messageId).catch(() => undefined)}
            className="ml-auto text-brand hover:underline"
          >
            {t("conversa.enquete.encerrarAgora")}
          </button>
        )}
      </div>
    </div>
  );
};
