import React, { useState } from "react";
import { Check, MessageSquare, X } from "lucide-react";

import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import type { FriendshipModel } from "~/@core/domain/models/friend-model";
import { AddFriendForm } from "~/components/AddFriendForm";
import { Avatar } from "~/components/Avatar";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

type Aba = "online" | "todos" | "pendentes" | "adicionar";

interface FriendsProps {
  onOpenConversation: (userId: string) => void;
}

export const Friends: React.FC<FriendsProps> = ({ onOpenConversation }) => {
  const { data: relacoes = [], isLoading } = useFindFriends(true);
  const [aba, setAba] = useState<Aba>("online");

  const amigos = relacoes.filter((r) => r.status === "ACCEPTED");
  const pendentes = relacoes.filter((r) => r.status === "PENDING_IN" || r.status === "PENDING_OUT");
  const recebidos = pendentes.filter((r) => r.status === "PENDING_IN").length;

  const listaDaAba =
    aba === "online" ? amigos.filter((r) => r.user.status !== "OFFLINE")
    : aba === "todos" ? amigos
    : aba === "pendentes" ? pendentes
    : [];

  const abas: { id: Aba; label: string; badge?: number }[] = [
    { id: "online", label: "Online" },
    { id: "todos", label: "Todos" },
    { id: "pendentes", label: "Pendentes", badge: recebidos },
    { id: "adicionar", label: "Adicionar amigo" },
  ];

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
      <header className="regiao-de-arrasto flex h-12 shrink-0 items-center gap-1 border-b border-divisor px-4 shadow-sm">
        <span className="mr-2 font-semibold">Amigos</span>
        {abas.map((item) => (
          <button
            key={item.id}
            onClick={() => setAba(item.id)}
            /*
              "Adicionar amigo" é botão, e não aba.

              As outras três filtram uma lista que já está na tela; esta abre um
              formulário. Vestida igual, ela se perdia no meio das irmãs — e é
              justamente a única coisa a fazer numa conta que ainda não tem
              ninguém. Agora é uma pastilha cheia da cor da casa, do jeito que
              se destaca sem gritar.
            */
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition",
              item.id === "adicionar"
                ? aba === item.id
                  ? "bg-brand font-medium text-white"
                  : "font-medium text-brand hover:bg-brand/10"
                : aba === item.id
                  ? "bg-surface-4 text-ink"
                  : "text-ink-muted hover:bg-surface-3 hover:text-ink",
            )}
          >
            {item.label}
            {Boolean(item.badge) && (
              <span className="rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {aba === "adicionar" ? (
          <AddFriendForm />
        ) : isLoading ? (
          <p className="text-sm text-ink-faint">Carregando…</p>
        ) : listaDaAba.length === 0 ? (
          <EmptyState aba={aba} />
        ) : (
          <>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              {aba === "pendentes" ? "Pendentes" : aba === "online" ? "Online" : "Todos os amigos"} —{" "}
              {listaDaAba.length}
            </h3>

            <div className="space-y-px">
              {listaDaAba.map((relacao) => (
                <FriendRow
                  key={relacao.id}
                  relacao={relacao}
                  onOpenConversation={onOpenConversation}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

const EmptyState: React.FC<{ aba: Aba }> = ({ aba }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
    <p className="text-ink-muted">
      {aba === "pendentes"
        ? "Nenhum pedido pendente."
        : aba === "online"
          ? "Ninguém online agora."
          : "Você ainda não tem amigos por aqui."}
    </p>
    <p className="max-w-xs text-sm text-ink-faint">
      Use a aba <span className="font-medium text-brand">Adicionar amigo</span> e o nome de usuário da pessoa.
    </p>
  </div>
);

interface FriendRowProps {
  relacao: FriendshipModel;
  onOpenConversation: (userId: string) => void;
}

const FriendRow: React.FC<FriendRowProps> = ({ relacao, onOpenConversation }) => {
  const respond = useRespondFriend();
  const remove = useRemoveFriend();

  const legenda =
    relacao.status === "PENDING_IN"
      ? "Pedido de amizade recebido"
      : relacao.status === "PENDING_OUT"
        ? "Pedido enviado"
        : `@${relacao.user.username}`;

  return (
    <div className="flex items-center gap-3 rounded-lg border-t border-line px-2 py-2.5 transition hover:bg-surface-3">
      <Avatar
        id={relacao.user.id}
        name={relacao.user.displayName}
        url={relacao.user.avatarUrl}
        size={36}
        status={relacao.status === "ACCEPTED" ? relacao.user.status : undefined}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{relacao.user.displayName}</p>
        <p className="truncate text-xs text-ink-faint">{legenda}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {relacao.status === "ACCEPTED" && (
          <Tooltip label="Conversar">
            <button
              onClick={() => onOpenConversation(relacao.user.id)}
              className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-ink"
            >
              <MessageSquare size={18} />
            </button>
          </Tooltip>
        )}

        {relacao.status === "PENDING_IN" && (
          <Tooltip label="Aceitar">
            <button
              onClick={() => respond.mutate({ friendshipId: relacao.id, accept: true })}
              className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-online"
            >
              <Check size={18} />
            </button>
          </Tooltip>
        )}

        <Tooltip
          label={
            relacao.status === "ACCEPTED"
              ? "Desfazer amizade"
              : relacao.status === "PENDING_IN"
                ? "Recusar"
                : "Cancelar pedido"
          }
        >
          <button
            onClick={() =>
              relacao.status === "PENDING_IN"
                ? respond.mutate({ friendshipId: relacao.id, accept: false })
                : remove.mutate(relacao.id)
            }
            className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-danger"
          >
            <X size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
