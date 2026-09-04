import React, { useEffect, useMemo, useState } from "react";
import { Check, Minus, Search, X } from "lucide-react";
import type { ChannelType, GuildMember, Permission, Role } from "@gravae/shared";
import { PERMISSION_LABELS } from "@gravae/shared";

import {
  useFindChannelOverwrites,
  useSetChannelOverwrite,
} from "~/@core/application/queries/role/use-channel-overwrites";
import { Avatar } from "~/components/Avatar";
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

const PERMISSOES_POR_TIPO: Record<"TEXTO" | "VOZ", Permission[]> = {
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

type Estado = "herdar" | "permitir" | "negar";

interface ChannelPermissionsBoardProps {
  guildId: string;
  channelId: string;
  channelType: ChannelType;
  roles: Role[];
  members: GuildMember[];
  minhasPermissoes: Permission[];
}

export const ChannelPermissionsBoard: React.FC<ChannelPermissionsBoardProps> = ({
  guildId,
  channelId,
  channelType,
  roles,
  members,
  minhasPermissoes,
}) => {
  const { data: overwrites = [] } = useFindChannelOverwrites(guildId, channelId);
  const salvar = useSetChannelOverwrite(guildId, channelId);

  const [alvo, setAlvo] = useState<{ id: string; type: "ROLE" | "MEMBER" } | null>(null);
  const [busca, setBusca] = useState("");

  const [pendentes, setPendentes] = useState<{ id: string; type: "ROLE" | "MEMBER" }[]>([]);

  const everyone = roles.find((r) => r.isEveryone);

  useEffect(() => {
    if (!alvo && everyone) setAlvo({ id: everyone.id, type: "ROLE" });
  }, [alvo, everyone]);

  useEffect(() => setPendentes([]), [channelId]);

  const lista = useMemo(() => {
    const comOverwrite = new Set([
      ...overwrites.map((o) => o.targetId),
      ...pendentes.map((p) => p.id),
    ]);

    const cargos = roles
      .filter((r) => r.isEveryone || comOverwrite.has(r.id))
      .sort((a, b) => b.position - a.position)
      .map((r) => ({ id: r.id, type: "ROLE" as const, nome: r.isEveryone ? "@everyone" : r.name, cor: r.color, user: null }));

    const pessoas = members
      .filter((m) => comOverwrite.has(m.user.id))
      .map((m) => ({ id: m.user.id, type: "MEMBER" as const, nome: m.user.displayName, cor: null, user: m.user }));

    return [...cargos, ...pessoas];
  }, [roles, members, overwrites, pendentes]);

  const termo = busca.trim().toLowerCase();
  const jaNaLista = new Set(lista.map((i) => i.id));

  const sugestoes = termo
    ? [
        ...roles
          .filter((r) => !r.isEveryone && !jaNaLista.has(r.id) && r.name.toLowerCase().includes(termo))
          .map((r) => ({ id: r.id, type: "ROLE" as const, nome: r.name, user: null })),
        ...members
          .filter(
            (m) =>
              !jaNaLista.has(m.user.id) &&
              (m.user.displayName.toLowerCase().includes(termo) ||
                m.user.username.toLowerCase().includes(termo)),
          )
          .map((m) => ({ id: m.user.id, type: "MEMBER" as const, nome: m.user.displayName, user: m.user })),
      ].slice(0, 8)
    : [];

  const atual = overwrites.find((o) => o.targetId === alvo?.id);
  const permissoes = PERMISSOES_POR_TIPO[channelType === "VOICE" ? "VOZ" : "TEXTO"];
  const souAdmin = minhasPermissoes.includes("ADMINISTRATOR");

  const estadoDe = (permissao: Permission): Estado => {
    if (atual?.allow.includes(permissao)) return "permitir";
    if (atual?.deny.includes(permissao)) return "negar";
    return "herdar";
  };

  const mudar = (permissao: Permission, estado: Estado) => {
    if (!alvo) return;

    const allow = (atual?.allow ?? []).filter((p) => p !== permissao);
    const deny = (atual?.deny ?? []).filter((p) => p !== permissao);

    if (estado === "permitir") allow.push(permissao);
    if (estado === "negar") deny.push(permissao);

    salvar.mutate({ guildId, channelId, targetId: alvo.id, type: alvo.type, allow, deny });
  };

  return (
    <div className="flex max-h-[60vh] gap-6">
            <aside className="flex w-52 shrink-0 flex-col">
              <div className="flex items-center gap-2 rounded bg-surface-0 px-2">
                <Search size={14} className="text-ink-faint" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Cargo ou pessoa"
                  className="bg-transparent px-0 py-1.5 text-sm"
                />
              </div>

              {sugestoes.length > 0 && (
                <div className="mt-1 overflow-hidden rounded border border-line bg-surface-1">
                  {sugestoes.map((s) => (
                    <button
                      key={`${s.type}-${s.id}`}
                      onClick={() => {
                        setPendentes((atuais) =>
                          atuais.some((p) => p.id === s.id)
                            ? atuais
                            : [...atuais, { id: s.id, type: s.type }],
                        );
                        setAlvo({ id: s.id, type: s.type });
                        setBusca("");
                      }}
                      className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition hover:bg-surface-3"
                    >
                      <span className="truncate">{s.nome}</span>
                      <span className="ml-auto shrink-0 text-10 uppercase text-ink-faint">
                        {s.type === "ROLE" ? "cargo" : "pessoa"}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
                {lista.map((item) => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => setAlvo({ id: item.id, type: item.type })}
                    className={cn(
                      "mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                      alvo?.id === item.id ? "bg-surface-4 text-ink" : "text-ink-muted hover:bg-surface-3",
                    )}
                  >
                    {item.user ? (
                      <Avatar id={item.user.id} name={item.user.displayName} url={item.user.avatarUrl} size={20} />
                    ) : (
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.cor ?? "#99aab5" }}
                      />
                    )}
                    <span className="truncate">{item.nome}</span>
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0 flex-1 overflow-y-auto pr-1">
              {alvo ? (
                <div className="space-y-4">
                  {permissoes.map((permissao) => {
                    const rotulo = PERMISSION_LABELS[permissao];
                    const bloqueado = !souAdmin && !minhasPermissoes.includes(permissao);
                    const estado = estadoDe(permissao);

                    return (
                      <div key={permissao} className={cn("flex items-start gap-4", bloqueado && "opacity-60")}>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{rotulo.nome}</p>
                          <p className="mt-0.5 text-xs text-ink-faint">{rotulo.descricao}</p>
                        </div>

                        <div className="flex shrink-0 overflow-hidden rounded border border-line">
                          <BotaoEstado
                            ativo={estado === "negar"}
                            disabled={bloqueado}
                            cor="danger"
                            onClick={() => mudar(permissao, "negar")}
                            titulo="Negar"
                          >
                            <X size={16} />
                          </BotaoEstado>
                          <BotaoEstado
                            ativo={estado === "herdar"}
                            disabled={bloqueado}
                            cor="neutro"
                            onClick={() => mudar(permissao, "herdar")}
                            titulo="Herdar do cargo"
                          >
                            <Minus size={16} />
                          </BotaoEstado>
                          <BotaoEstado
                            ativo={estado === "permitir"}
                            disabled={bloqueado}
                            cor="online"
                            onClick={() => mudar(permissao, "permitir")}
                            titulo="Permitir"
                          >
                            <Check size={16} />
                          </BotaoEstado>
                        </div>
                      </div>
                    );
                  })}

                  {atual && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        salvar.mutate(
                          { guildId, channelId, targetId: alvo.id, type: alvo.type, allow: [], deny: [] },
                          { onSuccess: () => everyone && setAlvo({ id: everyone.id, type: "ROLE" }) },
                        )
                      }
                    >
                      Voltar a herdar tudo (remover a exceção)
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-faint">Escolha um cargo ou uma pessoa à esquerda.</p>
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
  <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Permissões de {channelName}</DialogTitle>
      </DialogHeader>

      <DialogBody>
        <p className="mb-4 text-sm text-ink-muted">
          Aqui você muda o que vale <strong>neste canal</strong>. O que ficar em “herdar” continua
          seguindo o cargo.
        </p>

        <ChannelPermissionsBoard {...board} />
      </DialogBody>
    </DialogContent>
  </Dialog>
);

interface BotaoEstadoProps {
  ativo: boolean;
  disabled?: boolean;
  cor: "danger" | "neutro" | "online";
  titulo: string;
  onClick: () => void;
  children: React.ReactNode;
}

const BotaoEstado: React.FC<BotaoEstadoProps> = ({
  ativo,
  disabled,
  cor,
  titulo,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={titulo}
    className={cn(
      "flex size-8 items-center justify-center transition disabled:cursor-not-allowed",
      ativo
        ? cor === "danger"
          ? "bg-danger text-white"
          : cor === "online"
            ? "bg-online text-white"
            : "bg-surface-4 text-ink"
        : "text-ink-faint hover:bg-surface-3 hover:text-ink",
    )}
  >
    {children}
  </button>
);
