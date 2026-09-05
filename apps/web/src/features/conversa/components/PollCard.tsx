import React from "react";
import { BarChart3, Check } from "lucide-react";
import type { Poll } from "@gravae/shared";

import { closePoll, votePoll } from "~/@core/lib/websocket/emit-message-actions";
import { cn } from "~/lib/utils";
import { idiomaAtual, useTranslation } from "~/traducao";

interface PollCardProps {
  messageId: string;
  poll: Poll;
  currentUserId: string | undefined;
  isAuthor: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ messageId, poll, currentUserId, isAuthor }) => {
  const { t } = useTranslation();
  const total = poll.opcoes.reduce((soma, o) => soma + o.userIds.length, 0);
  const expirou = Boolean(poll.expiresAt && new Date(poll.expiresAt) < new Date());
  const encerrada = Boolean(poll.closedAt) || expirou;

  const maisVotada = Math.max(...poll.opcoes.map((o) => o.userIds.length), 0);

  return (
    <div data-gc="conversa.poll-card.div" className="mt-1 max-w-md rounded-lg border border-line bg-surface-1 p-4">
      <p data-gc="conversa.poll-card.p" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <BarChart3 data-gc="conversa.poll-card.bar-chart3" size={13} />
        {t(
          encerrada
            ? "conversa.enquete.encerrada"
            : poll.multiSelect
              ? "conversa.enquete.variasRespostas"
              : "conversa.enquete.titulo",
        )}
      </p>

      <p data-gc="conversa.poll-card.p--2" className="mt-1.5 font-semibold">{poll.pergunta}</p>

      <div data-gc="conversa.poll-card.div--2" className="mt-3 space-y-2">
        {poll.opcoes.map((opcao) => {
          const votos = opcao.userIds.length;
          const eu = currentUserId ? opcao.userIds.includes(currentUserId) : false;
          const porcento = total ? Math.round((votos / total) * 100) : 0;
          const vencendo = encerrada && votos > 0 && votos === maisVotada;

          return (
            <button data-gc="conversa.poll-card.button"
              key={opcao.id}
              disabled={encerrada}
              onClick={() => void votePoll(messageId, opcao.id).catch(() => undefined)}
              className={cn(
                "relative block w-full overflow-hidden rounded border px-3 py-2 text-left text-sm transition",
                eu ? "border-brand" : "border-line",
                !encerrada && "hover:border-ink-faint",
                encerrada && "cursor-default",
              )}
            >
              <span data-gc="conversa.poll-card.span"
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width]",
                  vencendo ? "bg-online/25" : eu ? "bg-brand/20" : "bg-surface-3",
                )}
                style={{ width: `${porcento}%` }}
              />

              <span data-gc="conversa.poll-card.span--2" className="relative flex items-center gap-2">
                {eu && <Check data-gc="conversa.poll-card.check" size={14} className="shrink-0 text-brand" />}
                <span data-gc="conversa.poll-card.span--3" className="min-w-0 flex-1 truncate">{opcao.texto}</span>
                <span data-gc="conversa.poll-card.span--4" className="shrink-0 text-xs text-ink-faint">
                  {t(votos === 1 ? "conversa.enquete.umVoto" : "conversa.enquete.votos", {
                    quantidade: votos,
                  })}{" "}
                  · {porcento}%
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

        {!encerrada && poll.expiresAt && (
          <span data-gc="conversa.poll-card.span--6">
            ·{" "}
            {t("conversa.enquete.encerraEm", {
              quando: new Intl.DateTimeFormat(idiomaAtual(), {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(poll.expiresAt)),
            })}
          </span>
        )}

        {!encerrada && isAuthor && (
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
