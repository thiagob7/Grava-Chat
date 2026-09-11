import React, { useMemo, useState } from "react";
import { List } from "@phosphor-icons/react";
import { Check, MessageSquare, Search, Users, X } from "lucide-react";

import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useRespondFriend } from "~/@core/application/queries/friend/use-respond-friend";
import { useRemoveFriend } from "~/@core/application/queries/friend/use-remove-friend";
import type { FriendshipModel } from "~/@core/domain/models/friend-model";
import { AddFriendForm } from "~/features/amizades/components/AddFriendForm";
import { EntryBox } from "~/features/conversa/components/CaixaDeEntrada";
import { Avatar } from "~/features/perfil/components/Avatar";
import { useConfirm } from "~/components/ui/confirm";
import { Input } from "~/components/ui/input";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

type Tab = "online" | "todos" | "pendentes" | "adicionar";

interface FriendsProps {
  onOpenConversation: (userId: string) => void;
  onOpenMenu?: () => void;
}

export const Friends: React.FC<FriendsProps> = ({ onOpenConversation, onOpenMenu }) => {
  const { t } = useTranslation();
  const { data: relations = [], isLoading } = useFindFriends(true);
  const [tab, setTab] = useState<Tab>("online");
  const [search, setSearch] = useState("");

  const friends = relations.filter((r) => r.status === "ACCEPTED");
  const pending = relations.filter((r) => r.status === "PENDING_IN" || r.status === "PENDING_OUT");
  const received = pending.filter((r) => r.status === "PENDING_IN").length;

  const listTab =
    tab === "online" ? friends.filter((r) => r.user.status !== "OFFLINE")
    : tab === "todos" ? friends
    : tab === "pendentes" ? pending
    : [];

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return listTab;

    return listTab.filter(
      (relation) =>
        relation.user.displayName.toLowerCase().includes(term) ||
        relation.user.username.toLowerCase().includes(term),
    );
  }, [listTab, search]);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "online", label: "Online" },
    { id: "todos", label: "Todos" },
    { id: "pendentes", label: "Pendentes", badge: received },
    { id: "adicionar", label: "Adicionar amigo" },
  ];

  return (
    <main data-gc="friends.friends.main" {...flxAttr("friendsColumn")} {...flx("listFriends", cn("topo-do-miolo flex min-w-0 flex-1 flex-col bg-surface-2", flxCls("friendsColumn")))}>
      <header data-gc="friends.friends.header" {...flx("channelTop", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor shadow-sm")}>
        <div data-gc="friends.friends.div"
          {...flx("topChannelCore", "flex h-full w-full items-center gap-1 overflow-x-auto px-4")}
        >
          {onOpenMenu && (
            <button data-gc="friends.friends.button.on-open-menu"
              onClick={onOpenMenu}
              aria-label={t("amizades.abrirMenu")}
              className="-ml-1 mr-1 shrink-0 rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink md:hidden"
            >
              <List data-gc="friends.friends.list" size={20} />
            </button>
          )}

          <span data-gc="friends.friends.span" {...flx("friendsTitle", "mr-2 flex shrink-0 items-center gap-2 font-semibold")}>
            <Users data-gc="friends.friends.users" size={18} className={cn("text-ink-muted", flxCls("titleFriendsIcon"))} />
            <span data-gc="friends.friends.span--2" {...flx("titleFriendsText", "hidden sm:inline")}>{t("amizades.amigos")}</span>
          </span>
          <span data-gc="friends.friends.span--3" {...flx("topFriendsDivider", "mr-2 hidden h-5 w-px shrink-0 bg-line sm:block")} />
          {tabs.map((item) => (
            <button data-gc="friends.friends.button"
              key={item.id}
              onClick={() => setTab(item.id)}
              {...flx(
                "friendsTab",
                cn(
                  "flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-sm transition",
                  item.id === "adicionar"
                    ? tab === item.id
                      ? "bg-brand/15 font-semibold text-brand"
                      : "bg-brand font-semibold text-sobre-marca shadow-sm hover:bg-brand-hover"
                    : tab === item.id
                      ? "bg-surface-4 text-ink"
                      : "text-ink-muted hover:bg-surface-3 hover:text-ink",
                  flxCls("tab"),
                  tab === item.id && cn(flxCls("friendsActiveTab"), flxCls("tabPicked")),
                  item.id === "adicionar" && flxCls("friendsPrincipalTab"),
                ),
              )}
            >
              {item.label}
              {Boolean(item.badge) && (
                <span data-gc="friends.friends.span--4" className="rounded-full bg-danger px-1.5 text-xs font-semibold text-sobre-marca">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div data-gc="friends.friends.div--2" className="ml-auto">
            <EntryBox data-gc="friends.friends.entry-box" />
          </div>
        </div>
      </header>

      <div data-gc="friends.friends.div--3" {...flx("tabFriendsBody", "flex-1 overflow-y-auto px-6 py-5")}>
        {tab === "adicionar" ? (
          <AddFriendForm data-gc="friends.friends.add-friend-form" />
        ) : isLoading ? (
          <p data-gc="friends.friends.p" className="text-sm text-ink-faint">Carregando…</p>
        ) : (
          <>
            <div data-gc="friends.friends.div--4" {...flx("searchFriendsFrame", "relative mb-4")}>
              <Search data-gc="friends.friends.search"
                size={16}
                className={cn(
                  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint",
                  flxCls("searchFriendsIcon"),
                )}
              />
              <Input data-gc="friends.friends.input"
                {...flxAttr("friendsSearch")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === "pendentes" ? "Buscar solicitações pendentes" : "Procurar amigos"
                }
                aria-label="Procurar na lista"
                className="h-10 border-transparent pl-9 text-sm shadow-none focus-visible:border-line-sutil focus-visible:ring-0"
              />
            </div>

            {visible.length === 0 ? (
              <EmptyState data-gc="friends.friends.empty-state" tab={tab} filtering={Boolean(search.trim())} />
            ) : (
              <>
                <h3 data-gc="friends.friends.h3" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {tab === "pendentes"
                    ? "Solicitações de amizade"
                    : tab === "online"
                      ? "Online"
                      : "Todos os amigos"}{" "}
                  — {visible.length}
                </h3>

                <div data-gc="friends.friends.div--5" className="space-y-px">
                  {visible.map((relation) => (
                    <FriendRow data-gc="friends.friends.friend-row.on-open-conversation"
                      key={relation.id}
                      relation={relation}
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

const EmptyState: React.FC<{ tab: Tab; filtering: boolean }> = ({ tab, filtering }) => (
  <div data-gc="friends.friends.div--6" className="flex flex-col items-center justify-center gap-3 py-24 text-center">
    <Users data-gc="friends.friends.users--2" size={48} className="text-ink-faint/60" strokeWidth={1.5} />

    <p data-gc="friends.friends.p--2" className="text-lg font-semibold">
      {filtering
        ? "Ninguém com esse nome"
        : tab === "pendentes"
          ? "Nenhum pedido pendente"
          : tab === "online"
            ? "Ninguém online agora"
            : "Esta lista de amigos precisa de mais gente"}
    </p>

    <p data-gc="friends.friends.p--3" className="max-w-sm text-sm text-ink-muted">
      {filtering ? (
        "Tente outro nome — a busca olha o apelido e o nome de usuário."
      ) : (
        <>
          Use a aba <span data-gc="friends.friends.span--5" className="font-medium text-brand">Adicionar amigo</span> e o nome de
          usuário da pessoa.
        </>
      )}
    </p>
  </div>
);

interface FriendRowProps {
  relation: FriendshipModel;
  onOpenConversation: (userId: string) => void;
}

const FriendRow: React.FC<FriendRowProps> = ({ relation, onOpenConversation }) => {
  const respond = useRespondFriend();
  const remove = useRemoveFriend();
  const confirm = useConfirm();

  const reply = async (event: React.MouseEvent, accept: boolean) => {
    if (!event.shiftKey) {
      const { confirmed } = await confirm({
        title: accept ? "Aceitar pedido de amizade" : "Recusar pedido de amizade",
        description: accept
          ? `Aceitar o pedido de amizade de ${relation.user.displayName}?`
          : `Recusar o pedido de ${relation.user.displayName}? Ela não é avisada — e pode pedir de novo.`,
        action: accept ? "Aceitar" : "Recusar",
        destructive: !accept,
        shiftHint: true,
      });

      if (!confirmed) return;
    }

    respond.mutate({ friendshipId: relation.id, accept: accept });
  };

  const undo = async (event: React.MouseEvent) => {
    if (!event.shiftKey) {
      const { confirmed } = await confirm({
        title:
          relation.status === "ACCEPTED" ? "Desfazer amizade" : "Cancelar o pedido enviado",
        description:
          relation.status === "ACCEPTED"
            ? `Tirar ${relation.user.displayName} da sua lista de amigos? A conversa continua onde está.`
            : `Cancelar o pedido enviado para ${relation.user.displayName}?`,
        action: relation.status === "ACCEPTED" ? "Desfazer" : "Cancelar pedido",
        shiftHint: true,
      });

      if (!confirmed) return;
    }

    remove.mutate(relation.id);
  };

  const legenda =
    relation.status === "PENDING_IN"
      ? "Pedido de amizade recebido"
      : relation.status === "PENDING_OUT"
        ? "Pedido enviado"
        : `@${relation.user.username}`;

  return (
    <div data-gc="friends.friends.div--7" className="flex items-center gap-3 rounded-lg border-t border-line px-2 py-2.5 transition hover:bg-surface-3">
      <Avatar data-gc="friends.friends.avatar"
        id={relation.user.id}
        name={relation.user.displayName}
        url={relation.user.avatarUrl}
        size={36}
        status={relation.status === "ACCEPTED" ? relation.user.status : undefined}
      />

      <div data-gc="friends.friends.div--8" className="min-w-0 flex-1">
        <p data-gc="friends.friends.p--4" className="truncate text-sm font-semibold">{relation.user.displayName}</p>
        <p data-gc="friends.friends.p--5" className="truncate text-xs text-ink-faint">{legenda}</p>
      </div>

      <div data-gc="friends.friends.div--9" className="flex shrink-0 items-center gap-2">
        {relation.status === "ACCEPTED" && (
          <Tooltip data-gc="friends.friends.tooltip" label="Conversar">
            <button data-gc="friends.friends.button--2"
              onClick={() => onOpenConversation(relation.user.id)}
              className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-ink"
            >
              <MessageSquare data-gc="friends.friends.message-square" size={18} />
            </button>
          </Tooltip>
        )}

        {relation.status === "PENDING_IN" && (
          <Tooltip data-gc="friends.friends.tooltip--2" label="Aceitar">
            <button data-gc="friends.friends.button--3"
              onClick={(e) => void reply(e, true)}
              className="rounded-full bg-surface-0 p-2 text-ink-muted transition hover:text-online"
            >
              <Check data-gc="friends.friends.check" size={18} />
            </button>
          </Tooltip>
        )}

        <Tooltip data-gc="friends.friends.tooltip--3"
          label={
            relation.status === "ACCEPTED"
              ? "Desfazer amizade"
              : relation.status === "PENDING_IN"
                ? "Recusar"
                : "Cancelar pedido"
          }
        >
          <button data-gc="friends.friends.button--4"
            onClick={(e) =>
              relation.status === "PENDING_IN" ? void reply(e, false) : void undo(e)
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
