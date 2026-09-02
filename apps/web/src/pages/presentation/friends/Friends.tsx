import React, { useMemo, useState } from "react";
import { Check, MessageSquare, Search, Users, X } from "lucide-react";

import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import type { FriendshipModel } from "~/@core/domain/models/friend-model";
import { AddFriendForm } from "~/components/AddFriendForm";
import { CaixaDeEntrada } from "~/components/CaixaDeEntrada";
import { Avatar } from "~/components/Avatar";
import { useConfirmar } from "~/components/ui/confirm";
import { Input } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

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

  /// A busca olha os dois nomes: quem procura "thi" pode estar atrás do
  /// apelido ou do @usuario, e não sabe qual dos dois vai casar.
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
    <main className="flex min-w-0 flex-1 flex-col bg-surface-2">
      <header className="regiao-de-arrasto flex h-12 shrink-0 items-center gap-1 border-b border-divisor px-4 shadow-sm">
        <span className="mr-2 flex items-center gap-2 font-semibold">
          <Users size={18} className="text-ink-muted" /> Meus amigos
        </span>
        <span className="mr-2 h-5 w-px bg-line" />
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

        <div className="ml-auto">
          <CaixaDeEntrada />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {aba === "adicionar" ? (
          <AddFriendForm />
        ) : isLoading ? (
          <p className="text-sm text-ink-faint">Carregando…</p>
        ) : (
          <>
            {/*
              A busca fica ACIMA do estado vazio de propósito: com dez amigos
              ela é o caminho mais curto até um deles, e com zero ela explica
              sozinha que a lista é filtrável quando encher.
            */}
            <div className="relative mb-4">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
              />
              <Input
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
              <EmptyState aba={aba} filtrando={Boolean(busca.trim())} />
            ) : (
              <>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {aba === "pendentes"
                    ? "Solicitações de amizade"
                    : aba === "online"
                      ? "Online"
                      : "Todos os amigos"}{" "}
                  — {visiveis.length}
                </h3>

                <div className="space-y-px">
                  {visiveis.map((relacao) => (
                    <FriendRow
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

/**
 * A tela vazia com desenho, título e explicação.
 *
 * Uma frase cinza solta no meio da tela parecia erro de carregamento. O
 * ícone grande diz "está vazio de propósito", e o título em negrito dá o que
 * fazer a seguir.
 */
const EmptyState: React.FC<{ aba: Aba; filtrando: boolean }> = ({ aba, filtrando }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
    <Users size={48} className="text-ink-faint/60" strokeWidth={1.5} />

    <p className="text-lg font-semibold">
      {filtrando
        ? "Ninguém com esse nome"
        : aba === "pendentes"
          ? "Nenhum pedido pendente"
          : aba === "online"
            ? "Ninguém online agora"
            : "Esta lista de amigos precisa de mais gente"}
    </p>

    <p className="max-w-sm text-sm text-ink-muted">
      {filtrando ? (
        "Tente outro nome — a busca olha o apelido e o nome de usuário."
      ) : (
        <>
          Use a aba <span className="font-medium text-brand">Adicionar amigo</span> e o nome de
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

  /*
    Aceitar e recusar pedem confirmação — e o Shift pula.

    Os dois botões são redondos, pequenos e vizinhos: errar o alvo é fácil, e
    "recusar" não tem desfazer (a pessoa teria que pedir de novo). O Shift
    existe pra quem limpa uma fila de pedidos e não quer confirmar dez vezes.
  */
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
              onClick={(e) => void responder(e, true)}
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
            onClick={(e) =>
              relacao.status === "PENDING_IN" ? void responder(e, false) : void desfazer(e)
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
