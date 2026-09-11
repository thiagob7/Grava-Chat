import React, { useEffect, useMemo, useState } from "react";
import { Check, Minus, Search, X } from "lucide-react";
import type { ChannelType, GuildMember, Permission, Role } from "@gravae/shared";
import { PERMISSION_LABELS } from "@gravae/shared";

import {
  useFindChannelOverwrites,
  useSetChannelOverwrite,
} from "~/@core/application/queries/role/use-channel-overwrites";
import { Avatar } from "~/features/perfil/components/Avatar";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const PERMISSIONS_BY_KIND: Record<"TEXTO" | "VOZ", Permission[]> = {
  TEXTO: [
    "VIEW_CHANNEL",
    "SEND_MESSAGES",
    "MANAGE_MESSAGES",
    "ATTACH_FILES",
    "ADD_REACTIONS",
    "MENTION_EVERYONE",
    "MANAGE_CHANNELS",
    "MANAGE_ROLES",
    "MANAGE_WEBHOOKS",
  ],
  VOZ: [
    "VIEW_CHANNEL",
    "CONNECT",
    "SPEAK",
    "VIDEO",
    "SHARE_SCREEN",
    "MUTE_MEMBERS",
    "MANAGE_CHANNELS",
    "MANAGE_ROLES",
  ],
};

type State = "herdar" | "permitir" | "negar";

interface ChannelPermissionsBoardProps {
  guildId: string;
  channelId: string;
  channelType: ChannelType;
  roles: Role[];
  members: GuildMember[];
  minePermissions: Permission[];
}

export const ChannelPermissionsBoard: React.FC<ChannelPermissionsBoardProps> = ({
  guildId,
  channelId,
  channelType,
  roles,
  members,
  minePermissions,
}) => {
  const { data: overwrites = [] } = useFindChannelOverwrites(guildId, channelId);
  const save = useSetChannelOverwrite(guildId, channelId);

  const [target, setTarget] = useState<{ id: string; type: "ROLE" | "MEMBER" } | null>(null);
  const [search, setSearch] = useState("");

  const [pending, setPending] = useState<{ id: string; type: "ROLE" | "MEMBER" }[]>([]);

  const everyone = roles.find((r) => r.isEveryone);

  useEffect(() => {
    if (!target && everyone) setTarget({ id: everyone.id, type: "ROLE" });
  }, [target, everyone]);

  useEffect(() => setPending([]), [channelId]);

  const list = useMemo(() => {
    const withOverwrite = new Set([
      ...overwrites.map((o) => o.targetId),
      ...pending.map((p) => p.id),
    ]);

    const roleList = roles
      .filter((r) => r.isEveryone || withOverwrite.has(r.id))
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, type: "ROLE" as const, name: r.isEveryone ? "@everyone" : r.name, color: r.color, user: null }));

    const people = members
      .filter((m) => withOverwrite.has(m.user.id))
      .map((m) => ({ id: m.user.id, type: "MEMBER" as const, name: m.user.displayName, color: null, user: m.user }));

    return [...roleList, ...people];
  }, [roles, members, overwrites, pending]);

  const term = search.trim().toLowerCase();
  const alreadyList = new Set(list.map((i) => i.id));

  const suggestions = term
    ? [
        ...roles
          .filter((r) => !r.isEveryone && !alreadyList.has(r.id) && r.name.toLowerCase().includes(term))
          .map((r) => ({ id: r.id, type: "ROLE" as const, name: r.name, user: null })),
        ...members
          .filter(
            (m) =>
              !alreadyList.has(m.user.id) &&
              (m.user.displayName.toLowerCase().includes(term) ||
                m.user.username.toLowerCase().includes(term)),
          )
          .map((m) => ({ id: m.user.id, type: "MEMBER" as const, name: m.user.displayName, user: m.user })),
      ].slice(0, 8)
    : [];

  const current = overwrites.find((o) => o.targetId === target?.id);
  const permissions = PERMISSIONS_BY_KIND[channelType === "VOICE" ? "VOZ" : "TEXTO"];
  const amAdmin = minePermissions.includes("ADMINISTRATOR");

  const stateFor = (permission: Permission): State => {
    if (current?.allow.includes(permission)) return "permitir";
    if (current?.deny.includes(permission)) return "negar";
    return "herdar";
  };

  const change = (permission: Permission, state: State) => {
    if (!target) return;

    const allow = (current?.allow ?? []).filter((p) => p !== permission);
    const deny = (current?.deny ?? []).filter((p) => p !== permission);

    if (state === "permitir") allow.push(permission);
    if (state === "negar") deny.push(permission);

    save.mutate({ guildId, channelId, targetId: target.id, type: target.type, allow, deny });
  };

  return (
    <div data-gc="servidor.channel-permissions-modal.div" className="flex max-h-[60vh] gap-6">
            <aside data-gc="servidor.channel-permissions-modal.aside" className="flex w-52 shrink-0 flex-col">
              <div data-gc="servidor.channel-permissions-modal.div--2" className="flex items-center gap-2 rounded bg-surface-0 px-2">
                <Search data-gc="servidor.channel-permissions-modal.search" size={14} className="text-ink-faint" />
                <Input data-gc="servidor.channel-permissions-modal.input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cargo ou pessoa"
                  className="bg-transparent px-0 py-1.5 text-sm"
                />
              </div>

              {suggestions.length > 0 && (
                <div data-gc="servidor.channel-permissions-modal.div--3" className="mt-1 overflow-hidden rounded border border-line bg-surface-1">
                  {suggestions.map((s) => (
                    <button data-gc="servidor.channel-permissions-modal.button"
                      key={`${s.type}-${s.id}`}
                      onClick={() => {
                        setPending((current) =>
                          current.some((p) => p.id === s.id)
                            ? current
                            : [...current, { id: s.id, type: s.type }],
                        );
                        setTarget({ id: s.id, type: s.type });
                        setSearch("");
                      }}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition hover:bg-surface-3"
                    >
                      <span data-gc="servidor.channel-permissions-modal.span" className="truncate">{s.name}</span>
                      <span data-gc="servidor.channel-permissions-modal.span--2" className="ml-auto shrink-0 text-10 uppercase text-ink-faint">
                        {s.type === "ROLE" ? "cargo" : "pessoa"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div data-gc="servidor.channel-permissions-modal.div--4" className="mt-3 min-h-0 flex-1 overflow-y-auto">
                {list.map((item) => (
                  <button data-gc="servidor.channel-permissions-modal.button--2"
                    key={`${item.type}-${item.id}`}
                    onClick={() => setTarget({ id: item.id, type: item.type })}
                    className={cn(
                      "mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                      target?.id === item.id ? "bg-surface-4 text-ink" : "text-ink-muted hover:bg-surface-3",
                    )}
                  >
                    {item.user ? (
                      <Avatar data-gc="servidor.channel-permissions-modal.avatar" id={item.user.id} name={item.user.displayName} url={item.user.avatarUrl} size={20} />
                    ) : (
                      <span data-gc="servidor.channel-permissions-modal.span--3"
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color ?? "#99aab5" }}
                      />
                    )}
                    <span data-gc="servidor.channel-permissions-modal.span--4" className="truncate">{item.name}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div data-gc="servidor.channel-permissions-modal.div--5" className="min-w-0 flex-1 overflow-y-auto pr-1">
              {target ? (
                <div data-gc="servidor.channel-permissions-modal.div--6" className="space-y-4">
                  {permissions.map((permission) => {
                    const label = PERMISSION_LABELS[permission];
                    const blocked = !amAdmin && !minePermissions.includes(permission);
                    const state = stateFor(permission);

                    return (
                      <div data-gc="servidor.channel-permissions-modal.div--7" key={permission} className={cn("flex items-start gap-4", blocked && "opacity-60")}>
                        <div data-gc="servidor.channel-permissions-modal.div--8" className="min-w-0 flex-1">
                          <p data-gc="servidor.channel-permissions-modal.p" className="text-sm font-medium">{label.name}</p>
                          <p data-gc="servidor.channel-permissions-modal.p--2" className="mt-0.5 text-xs text-ink-faint">{label.description}</p>
                        </div>

                        <div data-gc="servidor.channel-permissions-modal.div--9" className="flex shrink-0 overflow-hidden rounded border border-line">
                          <ButtonState data-gc="servidor.channel-permissions-modal.button-state"
                            active={state === "negar"}
                            disabled={blocked}
                            color="danger"
                            onClick={() => change(permission, "negar")}
                            title="Negar"
                          >
                            <X data-gc="servidor.channel-permissions-modal.x" size={16} />
                          </ButtonState>
                          <ButtonState data-gc="servidor.channel-permissions-modal.button-state--2"
                            active={state === "herdar"}
                            disabled={blocked}
                            color="neutro"
                            onClick={() => change(permission, "herdar")}
                            title="Herdar do cargo"
                          >
                            <Minus data-gc="servidor.channel-permissions-modal.minus" size={16} />
                          </ButtonState>
                          <ButtonState data-gc="servidor.channel-permissions-modal.button-state--3"
                            active={state === "permitir"}
                            disabled={blocked}
                            color="online"
                            onClick={() => change(permission, "permitir")}
                            title="Permitir"
                          >
                            <Check data-gc="servidor.channel-permissions-modal.check" size={16} />
                          </ButtonState>
                        </div>
                      </div>
                    );
                  })}

                  {current && (
                    <Button data-gc="servidor.channel-permissions-modal.button--3"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        save.mutate(
                          { guildId, channelId, targetId: target.id, type: target.type, allow: [], deny: [] },
                          { onSuccess: () => everyone && setTarget({ id: everyone.id, type: "ROLE" }) },
                        )
                      }
                    >
                      Voltar a herdar tudo (remover a exceção)
                    </Button>
                  )}
                </div>
              ) : (
                <p data-gc="servidor.channel-permissions-modal.p--3" className="text-sm text-ink-faint">Escolha um cargo ou uma pessoa à esquerda.</p>
              )}
            </div>
    </div>
  );
};

interface ChannelPermissionsModalProps extends ChannelPermissionsBoardProps {
  open: boolean;
  onClose: () => void;
  channelName: string;
}

export const ChannelPermissionsModal: React.FC<ChannelPermissionsModalProps> = ({
  open,
  onClose,
  channelName,
  ...board
}) => (
  <Dialog data-gc="servidor.channel-permissions-modal.dialog" open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent data-gc="servidor.channel-permissions-modal.dialog-content" className="max-w-3xl">
      <DialogHeader data-gc="servidor.channel-permissions-modal.dialog-header">
        <DialogTitle data-gc="servidor.channel-permissions-modal.dialog-title">Permissões de {channelName}</DialogTitle>
      </DialogHeader>

      <DialogBody data-gc="servidor.channel-permissions-modal.dialog-body">
        <p data-gc="servidor.channel-permissions-modal.p--4" className="mb-4 text-sm text-ink-muted">
          Aqui você muda o que vale <strong data-gc="servidor.channel-permissions-modal.strong">neste canal</strong>. O que ficar em “herdar” continua
          seguindo o cargo.
        </p>

        <ChannelPermissionsBoard data-gc="servidor.channel-permissions-modal.channel-permissions-board" {...board} />
      </DialogBody>
    </DialogContent>
  </Dialog>
);

interface ButtonStateProps {
  active: boolean;
  disabled?: boolean;
  color: "danger" | "neutro" | "online";
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}

const ButtonState: React.FC<ButtonStateProps> = ({
  active,
  disabled,
  color,
  title,
  onClick,
  children,
}) => (
  <button data-gc="servidor.channel-permissions-modal.button.on-click"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      "flex size-8 items-center justify-center transition disabled:cursor-not-allowed",
      active
        ? color === "danger"
          ? "bg-danger text-sobre-marca"
          : color === "online"
            ? "bg-online text-sobre-marca"
            : "bg-surface-4 text-ink"
        : "text-ink-faint hover:bg-surface-3 hover:text-ink",
    )}
  >
    {children}
  </button>
);
