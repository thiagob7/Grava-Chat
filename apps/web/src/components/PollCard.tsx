import React from "react";
import { BarChart3, Check } from "lucide-react";
import type { Poll } from "@gravae/shared";

import { closePoll, votePoll } from "~/@core/lib/websocket/emit-message-actions";
import { cn } from "~/lib/utils";

interface PollCardProps {
  messageId: string;
  poll: Poll;
  currentUserId: string | undefined;
  /** só quem criou pode encerrar antes da hora */
  isAuthor: boolean;
}

export const PollCard: React.FC<PollCardProps> = ({ messageId, poll, currentUserId, isAuthor }) => {
  const total = poll.opcoes.reduce((soma, o) => soma + o.userIds.length, 0);
  const expirou = Boolean(poll.expiresAt && new Date(poll.expiresAt) < new Date());
  const encerrada = Boolean(poll.closedAt) || expirou;

  const maisVotada = Math.max(...poll.opcoes.map((o) => o.userIds.length), 0);

  return (
    <div className="mt-1 max-w-md rounded-lg border border-line bg-surface-1 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        <BarChart3 size={13} />
        {encerrada ? "Enquete encerrada" : poll.multiSelect ? "Enquete — várias respostas" : "Enquete"}
      </p>

      <p className="mt-1.5 font-semibold">{poll.pergunta}</p>

      <div className="mt-3 space-y-2">
        {poll.opcoes.map((opcao) => {
          const votos = opcao.userIds.length;
          const eu = currentUserId ? opcao.userIds.includes(currentUserId) : false;
          const porcento = total ? Math.round((votos / total) * 100) : 0;
          const vencendo = encerrada && votos > 0 && votos === maisVotada;

          return (
            <button
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
              {/* a barra é o fundo: ela cresce sem empurrar o texto */}
              <span
                className={cn(
                  "absolute inset-y-0 left-0 transition-[width]",
                  vencendo ? "bg-online/25" : eu ? "bg-brand/20" : "bg-surface-3",
                )}
                style={{ width: `${porcento}%` }}
              />

              <span className="relative flex items-center gap-2">
                {eu && <Check size={14} className="shrink-0 text-brand" />}
                <span className="min-w-0 flex-1 truncate">{opcao.texto}</span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {votos} {votos === 1 ? "voto" : "votos"} · {porcento}%
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-ink-faint">
        <span>
          {total} {total === 1 ? "voto no total" : "votos no total"}
        </span>

        {!encerrada && poll.expiresAt && (
          <span>· encerra {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(poll.expiresAt))}</span>
        )}

        {!encerrada && isAuthor && (
          <button
            onClick={() => void closePoll(messageId).catch(() => undefined)}
            className="ml-auto text-brand hover:underline"
          >
            Encerrar agora
          </button>
        )}
      </div>
    </div>
  );
};
