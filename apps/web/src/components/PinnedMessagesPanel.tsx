import React from "react";
import { Pin, PinOff } from "lucide-react";

import { useFindPins, usePinMessage } from "~/@core/application/queries/message/use-pins";
import { Avatar } from "~/components/Avatar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";

interface PinnedMessagesPanelProps {
  channelId: string;
  /** só quem modera mensagens pode desafixar daqui */
  canManage: boolean;
}

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({ channelId, canManage }) => {
  const [aberto, setAberto] = React.useState(false);
  const { data: fixadas = [] } = useFindPins(channelId, aberto);
  const pinMessage = usePinMessage(channelId);

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button aria-label="Mensagens fixadas" className="text-ink-muted transition hover:text-ink">
          <Tooltip label="Mensagens fixadas">
            <Pin size={20} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Pin size={16} />
          <h3 className="font-semibold">Mensagens fixadas</h3>
        </header>

        <div className="max-h-96 overflow-y-auto">
          {!fixadas.length && (
            <div className="px-6 py-10 text-center">
              <Pin size={32} className="mx-auto text-ink-faint" />
              <p className="mt-3 text-sm text-ink-muted">
                Este canal não tem mensagens fixadas… por enquanto.
              </p>
            </div>
          )}

          {fixadas.map((mensagem) => (
            <article key={mensagem.id} className="group flex gap-3 border-b border-line px-4 py-3">
              <Avatar
                id={mensagem.author.id}
                name={mensagem.author.displayName}
                url={mensagem.author.avatarUrl}
                size={32}
              />

              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="truncate text-sm font-medium">{mensagem.author.displayName}</span>
                  <span className="shrink-0 text-[11px] text-ink-faint">
                    {formatTimestamp(mensagem.createdAt)}
                  </span>
                </p>
                <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted">
                  {mensagem.content || (mensagem.attachments.length ? "(anexo)" : "(enquete)")}
                </p>
              </div>

              {canManage && (
                <button
                  onClick={() => pinMessage.mutate({ messageId: mensagem.id, pin: false })}
                  title="Desafixar"
                  className="self-start rounded p-1.5 text-ink-faint opacity-0 transition group-hover:opacity-100 hover:text-danger"
                >
                  <PinOff size={14} />
                </button>
              )}
            </article>
          ))}
        </div>

        <p className="px-4 py-3 text-xs text-ink-faint">
          <span className="font-semibold text-online">FICA A DICA:</span> quem tem a permissão
          “Gerenciar mensagens” pode fixar direto no menu da mensagem.
        </p>
      </PopoverContent>
    </Popover>
  );
};
