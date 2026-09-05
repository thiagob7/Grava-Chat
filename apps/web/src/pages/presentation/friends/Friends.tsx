import React, { useMemo, useState } from "react";
import { Check, MessageSquare, Search, Users, X } from "lucide-react";

import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import type { FriendshipModel } from "~/@core/domain/models/friend-model";
import { AddFriendForm } from "~/features/amizades/components/AddFriendForm";
import { CaixaDeEntrada } from "~/features/conversa/components/CaixaDeEntrada";
import { Avatar } from "~/features/perfil/components/Avatar";
import { useConfirmar } from "~/components/ui/confirm";
import { Input } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { flx, flxCls } from "~/lib/compat-fluxer";

type Aba = "online" | "todos" | "pendentes" | "adicionar";

interface FriendsProps {
  onOpenConversation: (userId: string) => void;
}

export const Friends: React.FC<FriendsProps> = ({ onOpenConversation }) => {
  const { data: relacoes = [], isLoading } = useFindFriends(true);
  const [aba, setAba] = useState<Aba>("online");
  const [busca, setBusca] = useState("");

  const amigos = relacoes.filter((r) => r.status === "ACCEPTED");
  const pendentes = relacoes.filter((r) => r.status === "PENDING_IN" || r.status === "PENDING_OUT");
  const recebidos = pendentes.filter((r) => r.status === "PENDING_IN").length;

  const listaDaAba =
    aba === "online" ? amigos.filter((r) => r.user.status !== "OFFLINE")
    : aba === "todos" ? amigos
    : aba === "pendentes" ? pendentes
    : [];

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return listaDaAba;

    return listaDaAba.filter(
      (relacao) =>
        relacao.user.displayName.toLowerCase().includes(termo) ||
        relacao.user.username.toLowerCase().includes(termo),
    );
  }, [listaDaAba, busca]);

  const abas: { id: Aba; label: string; badge?: number }[] = [
    { id: "online", label: "Online" },
    { id: "todos", label: "Todos" },
    { id: "pendentes", label: "Pendentes", badge: recebidos },
    { id: "adicionar", label: "Adicionar amigo" },
  ];

  return (
    <main data-gc="friends.friends.main" {...flx("listaDeAmigos", cn("flex min-w-0 flex-1 flex-col bg-surface-2", flxCls("colunaDeAmigos")))}>
      <header data-gc="friends.friends.header" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto flex h-[var(--layout-header-height)] shrink-0 items-center gap-1 border-b border-divisor px-4 shadow-sm")}>
        <span data-gc="friends.friends.span" className="mr-2 flex items-center gap-2 font-semibold">
          <Users data-gc="friends.friends.users" size={18} className="text-ink-muted" /> Meus amigos
        </span>
        <span data-gc="friends.friends.span--2" className="mr-2 h-5 w-px bg-line" />
        {abas.map((item) => (
          <button data-gc="friends.friends.button"
            key={item.id}
            onClick={() => setAba(item.id)}
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
              <span data-gc="friends.friends.span--3" className="rounded-full bg-danger px-1.5 text-xs font-semibold text-white">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div data-gc="friends.friends.div" className="ml-auto">
          <CaixaDeEntrada data-gc="friends.friends.caixa-de-entrada" />
        </div>
      </header>

      <div data-gc="friends.friends.div--2" className="flex-1 overflow-y-auto px-6 py-5">
        {aba === "adicionar" ? (
          <AddFriendForm data-gc="friends.friends.add-friend-form" />
        ) : isLoading ? (
          <p data-gc="friends.friends.p" className="text-sm text-ink-faint">Carregando…</p>
        ) : (
          <>
            <div data-gc="friends.friends.div--3" className="relative mb-4">
              <Search data-gc="friends.friends.search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input data-gc="friends.friends.input"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={
                  aba === "pendentes" ? "Buscar solicitações pendentes" : "Procurar amigos"
                }
                aria-label="Procurar na lista"
                className="h-10 border-transparent pl-9 text-sm shadow-none focus-visible:border-white/15 focus-visible:ring-0"
              />
            </div>

            {visiveis.length === 0 ? (
              <EmptyState data-gc="friends.friends.empty-state" aba={aba} filtrando={Boolean(busca.trim())} />
            ) : (
              <>
                <h3 data-gc="friends.friends.h3" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {aba === "pendentes"
                    ? "Solicitações de amizade"
                    : aba === "online"
                      ? "Online"
                      : "Todos os amigos"}{" "}
                  — {visiveis.length}
                </h3>

                <div data-gc="friends.friends.div--4" className="space-y-px">
                  {visiveis.map((relacao) => (
                    <FriendRow data-gc="friends.friends.friend-row.on-open-conversation"
                      key={relacao.id}
                      relacao={relacao}
                      onOpenConversation={onOpenConversation}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
};

const EmptyState: React.FC<{ aba: Aba; filtrando: boolean }> = ({ aba, filtrando }) => (
  <div data-gc="friends.friends.div--5" className="flex flex-col items-center justify-center gap-3 py-24 text-center">
    <Users data-gc="friends.friends.users--2" size={48} className="text-ink-faint/60" strokeWidth={1.5} />

    <p data-gc="friends.friends.p--2" className="text-lg font-semibold">
      {filtrando
        ? "Ninguém com esse nome"
        : aba === "pendentes"
          ? "Nenhum pedido pendente"
          : aba === "online"
            ? "Ninguém online agora"
            : "Esta lista de amigos precisa de mais gente"}
    </p>

    <p data-gc="friends.friends.p--3" className="max-w-sm text-sm text-ink-muted">
      {filtrando ? (
        "Tente outro nome — a busca olha o apelido e o nome de usuário."
      ) : (
        <>
          Use a aba <span data-gc="friends.friends.span--4" className="font-medium text-brand">Adicionar amigo</span> e o nome de
          usuário da pessoa.
        </>
      )}
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
  const confirmar = useConfirmar();

  const responder = async (evento: React.MouseEvent, aceitar: boolean) => {
    if (!evento.shiftKey) {
      const { confirmado } = await confirmar({
        titulo: aceitar ? "Aceitar pedido de amizade" : "Recusar pedido de amizade",
        descricao: aceitar
          ? `Aceitar o pedido de amizade de ${relacao.user.displayName}?`
          : `Recusar o pedido de ${relacao.user.displayName}? Ela não é avisada — e pode pedir de novo.`,
        acao: aceitar ? "Aceitar" : "Recusar",
        destrutivo: !aceitar,
        dicaDoShift: true,
      });

      if (!confirmado) return;
    }

    respond.mutate({ friendshipId: relacao.id, accept: aceitar });
  };

  const desfazer = async (evento: React.MouseEvent) => {
    if (!evento.shiftKey) {
      const { confirmado } = await confirmar({
        titulo:
          relacao.status === "ACCEPTED" ? "Desfazer amizade" : "Cancelar o pedido enviado",
        descricao:
          relacao.status === "ACCEPTED"
            ? `Tirar ${relacao.user.displayName} da sua lista de amigos? A conversa continua onde está.`
            : `Cancelar o pedido enviado para ${relacao.user.displayName}?`,
        acao: relacao.status === "ACCEPTED" ? "Desfazer" : "Cancelar pedido",
        dicaDoShift: true,
      });

      if (!confirmado) return;
    }

    remove.mutate(relacao.id);
  };

  const legenda =
    relacao.status === "PENDING_IN"
      ? "Pedido de amizade recebido"
      : relacao.status === "PENDING_OUT"
        ? "Pedido enviado"
        : `@${relacao.user.username}`;

  return (
    <div data-gc="friends.friends.div--6" className="flex items-center gap-3 rounded-lg border-t border-line px-2 py-2.5 transition hover:bg-surface-3">
      <Avatar data-gc="friends.friends.avatar"
        id={relacao.user.id}
        name={relacao.user.displayName}
        url={relacao.user.avatarUrl}
        size={36}
        status={relacao.status === "ACCEPTED" ? relacao.user.status : undefined}
      />

      <div data-gc="friends.friends.div--7" className="min-w-0 flex-1">
        <p data-gc="friends.friends.p--4" className="truncate text-sm font-semibold">{relacao.user.displayName}</p>
        <p data-gc="friends.friends.p--5" className="truncate text-xs text-ink-faint">{legenda}</p>
      </div>

      <div data-gc="friends.friends.div--8" className="flex shrink-0 items-center gap-2">
        {relacao.status === "ACCEPTED" && (
          <Tooltip data-gc="friends.friends.tooltip" label="Conversar">
            <button data-gc="friends.friends.button--2"
              onClick={() => onOpenConversation(relacao.user.id)}
              className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-ink"
            >
              <MessageSquare data-gc="friends.friends.message-square" size={18} />
            </button>
          </Tooltip>
        )}

        {relacao.status === "PENDING_IN" && (
          <Tooltip data-gc="friends.friends.tooltip--2" label="Aceitar">
            <button data-gc="friends.friends.button--3"
              onClick={(e) => void responder(e, true)}
              className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-online"
            >
              <Check data-gc="friends.friends.check" size={18} />
            </button>
          </Tooltip>
        )}

        <Tooltip data-gc="friends.friends.tooltip--3"
          label={
            relacao.status === "ACCEPTED"
              ? "Desfazer amizade"
              : relacao.status === "PENDING_IN"
                ? "Recusar"
                : "Cancelar pedido"
          }
        >
          <button data-gc="friends.friends.button--4"
            onClick={(e) =>
              relacao.status === "PENDING_IN" ? void responder(e, false) : void desfazer(e)
            }
            className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-danger"
          >
            <X data-gc="friends.friends.x" size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
};
