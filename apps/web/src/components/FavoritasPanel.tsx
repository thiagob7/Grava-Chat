import React from "react";
import { Bookmark, BookmarkX } from "lucide-react";

import {
  useFavoriteMessages,
  useToggleFavoriteMessage,
} from "~/@core/application/queries/message/use-message-favorites";
import { Avatar } from "~/components/Avatar";
import { MessageContent } from "~/components/MessageContent";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { formatTimestamp } from "~/lib/format";

/**
 * As mensagens que você guardou, de qualquer canal — favoritar é seu, e não
 * do canal, então o painel não filtra por onde você está.
 */
export const FavoritasPanel: React.FC = () => {
  const [aberto, setAberto] = React.useState(false);
  const { data: favoritas = [], isLoading } = useFavoriteMessages(aberto);
  const alternar = useToggleFavoriteMessage();

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          aria-label="Mensagens favoritas"
          className="text-ink-muted transition hover:text-ink"
        >
          <Tooltip label="Mensagens favoritas">
            <Bookmark size={20} />
          </Tooltip>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-96 p-0">
        <header className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Bookmark size={16} />
          <h3 className="font-semibold">Mensagens favoritas</h3>
        </header>

        <div className="max-h-96 overflow-y-auto">
          {isLoading && <p className="px-6 py-10 text-center text-sm text-ink-faint">Carregando…</p>}

          {!isLoading && !favoritas.length && (
            <div className="px-6 py-10 text-center">
              <Bookmark size={32} className="mx-auto text-ink-faint" />
              <p className="mt-3 text-sm text-ink-muted">
                Nada guardado ainda. Passe o mouse numa mensagem, segure Shift e clique no
                marcador — ou use o menu dos três pontos.
              </p>
            </div>
          )}

          {favoritas.map((mensagem) => (
            <article key={mensagem.id} className="group flex gap-3 border-b border-line px-4 py-3">
              <Avatar
                id={mensagem.author.id}
                name={mensagem.author.displayName}
                url={mensagem.author.avatarUrl}
                size={32}
              />

              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="truncate font-semibold">{mensagem.author.displayName}</span>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {formatTimestamp(mensagem.createdAt)}
                  </span>
                </p>

                {/*
                  Sem `mencoes`: as favoritas vêm de qualquer servidor, e não
                  dá pra ter à mão os nomes de todos eles. O MessageContent
                  cai em "@alguém", que é melhor que o `<@id>` cru. As imagens
                  são achatadas — aqui o espaço é de uma prévia, não da
                  mensagem inteira.
                */}
                <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-sm text-ink-muted [&_img]:inline-block [&_img]:size-4 [&_img]:align-text-bottom">
                  {mensagem.content ? (
                    <MessageContent content={mensagem.content} emojis={[]} />
                  ) : (
                    "(anexo)"
                  )}
                </p>
              </div>

              <button
                onClick={() => alternar.mutate({ messageId: mensagem.id, favorita: true })}
                aria-label="Tirar dos favoritos"
                title="Tirar dos favoritos"
                className="h-fit rounded p-1 text-ink-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
              >
                <BookmarkX size={16} />
              </button>
            </article>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
