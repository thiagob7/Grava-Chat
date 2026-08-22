import React, { useState } from "react";
import {
  ChevronDown,
  Hash,
  Lock,
  LogOut,
  MessageSquare,
  MessagesSquare,
  Plus,
  Settings,
  Trash2,
  UserPlus,
  Volume2,
} from "lucide-react";

import type { GuildDetailModel, GuildSummaryModel } from "~/@core/domain/models/guild-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { UserPanel } from "~/components/UserPanel";
import { ChannelSettingsModal } from "~/components/channel-settings/ChannelSettingsModal";
import { CreateChannelModal } from "~/components/CreateChannelModal";
import { InviteModal } from "~/components/InviteModal";
import { CallTimer } from "~/components/CallTimer";
import { VoiceMembers } from "~/components/VoiceMembers";
import { useVoiceSync } from "~/hooks/use-voice-sync";
import { VoicePanel } from "~/components/VoicePanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ServerSettingsModal } from "~/components/server-settings/ServerSettingsModal";
import { Tooltip } from "~/components/ui/tooltip";
import { usePermissions } from "~/hooks/use-permissions";
import { cn } from "~/lib/utils";
import { toast } from "react-toastify";
import { useVoiceStore } from "~/stores/voice-store";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";

interface ChannelSidebarProps {
  detail: GuildDetailModel | undefined;
  summary: GuildSummaryModel | undefined;
  activeChannelId: string | undefined;
  /** por canal: o id da última lida e quantas entraram depois */
  readStates: Record<string, { lido: string | null; naoLidas: number; mencoes: number }>;
  user: SelfUserModel | null;
  onSelectChannel: (channelId: string) => void;
  onLogout: () => void;
  /** canal de voz em que a CONTA está, segundo o servidor */
  accountVoiceChannelId: string | null;
  onMoveCallHere: (channelId: string) => void;
  onLeaveGuild: () => void;
  /** abre o chat lateral de um canal de voz */
  onOpenVoiceChat?: (channelId: string) => void;
}

export const ChannelSidebar: React.FC<ChannelSidebarProps> = ({
  detail,
  summary,
  activeChannelId,
  readStates,
  user,
  onSelectChannel,
  onLogout,
  accountVoiceChannelId,
  onMoveCallHere,
  onLeaveGuild,
  onOpenVoiceChat,
}) => {
  const voiceChannelId = useVoiceStore((s) => s.channelId);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creatingIn, setCreatingIn] = useState<string | null | false>(false);
  const [inviting, setInviting] = useState(false);
  const [configurando, setConfigurando] = useState(false);
  const [editandoCanal, setEditandoCanal] = useState<string | null>(null);

  const { can, canInChannel } = usePermissions(detail);

  // a lista de quem está na chamada acompanha o LiveKit, não só o socket
  useVoiceSync(detail?.guild.id, user?.id);
  const canManage = can("MANAGE_GUILD");
  const canManageChannels = can("MANAGE_CHANNELS");
  const canManageRoles = can("MANAGE_ROLES");
  const canManageWebhooks = can("MANAGE_WEBHOOKS");
  // a tela de configurações abre pra quem administra QUALQUER coisa: quem só
  // cuida dos webhooks também precisa chegar lá
  const podeConfigurar = canManage || canManageRoles || canManageWebhooks;
  const isOwner = Boolean(summary?.isOwner);
  const channels = detail?.channels ?? [];
  const uncategorized = channels.filter((c) => !c.categoryId);

  const groups = [
    ...(uncategorized.length ? [{ id: null, name: null, channels: uncategorized }] : []),
    ...(detail?.categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      channels: channels.filter((c) => c.categoryId === category.id),
    })),
  ];

  const { largura, arrastando, alca, limites } = useLarguraAjustavel("canais", {
    padrao: 240,
    min: 180,
    max: 420,
    borda: "direita",
  });

  return (
    <>
      <aside
        className="relative flex shrink-0 flex-col bg-surface-1"
        style={{ width: largura }}
      >
        <header className="flex h-12 items-center justify-between border-b border-black/20 shadow-sm">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!detail}>
              <button className="flex h-full min-w-0 flex-1 items-center gap-1 px-4 text-left transition hover:bg-surface-3">
                <h1 className="truncate font-semibold">{detail?.guild.name ?? "…"}</h1>
                <ChevronDown size={16} className="shrink-0 text-ink-muted" />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64">
              {can("CREATE_INVITE") && (
                <DropdownMenuItem onSelect={() => setInviting(true)}>
                  Convidar pessoas <UserPlus size={16} />
                </DropdownMenuItem>
              )}

              {podeConfigurar && (
                <DropdownMenuItem onSelect={() => setConfigurando(true)}>
                  Configurações do servidor <Settings size={16} />
                </DropdownMenuItem>
              )}

              {canManageChannels && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setCreatingIn(null)}>
                    Criar canal <Plus size={16} />
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(detail?.guild.id ?? "");
                  toast.success("ID copiado.");
                }}
              >
                Copiar ID do servidor
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              {isOwner ? (
                <DropdownMenuItem danger onSelect={() => setConfigurando(true)}>
                  Excluir servidor <Trash2 size={16} />
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem danger onSelect={() => onLeaveGuild()}>
                  Sair do servidor <LogOut size={16} />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {detail && can("CREATE_INVITE") && (
            <Tooltip label="Convidar amigos">
              <button
                onClick={() => setInviting(true)}
                className="mr-4 shrink-0 text-ink-muted transition hover:text-ink"
              >
                <UserPlus size={18} />
              </button>
            </Tooltip>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-3">
          {groups.map((group) => {
            const isCollapsed = group.id ? collapsed[group.id] : false;

            return (
              <section key={group.id ?? "sem-categoria"} className="mb-4">
                {group.name && (
                  <div className="group flex items-center justify-between px-1">
                    <button
                      onClick={() =>
                        group.id && setCollapsed((c) => ({ ...c, [group.id!]: !c[group.id!] }))
                      }
                      className="flex flex-1 items-center gap-0.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
                    >
                      <ChevronDown size={12} className={isCollapsed ? "-rotate-90" : ""} />
                      <span className="truncate">{group.name}</span>
                    </button>
                    {canManageChannels && (
                      <button
                        onClick={() => setCreatingIn(group.id)}
                        title="Criar canal"
                        className="text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                )}

                {!isCollapsed &&
                  group.channels.map((channel) => {
                    const active = channel.id === activeChannelId;
                    const leitura = readStates[channel.id];
                    const unread =
                      !active && channel.lastMessageId && channel.lastMessageId !== leitura?.lido;
                    const naoLidas = unread ? (leitura?.naoLidas ?? 0) : 0;
                    // menção pinta de vermelho; não-lida comum é só um número
                    const mencoes = unread ? (leitura?.mencoes ?? 0) : 0;
                    const inThisCall = voiceChannelId === channel.id;
                    const bloqueado =
                      channel.type === "VOICE" && !canInChannel(channel.id, "CONNECT");

                    /**
                     * Começo da chamada: quem entrou primeiro manda no relógio.
                     *
                     * O filtro não é paranoia — estado de voz gravado antes de
                     * `joinedAt` existir chega sem o campo, e `Math.min` de um
                     * `undefined` devolve `NaN`, que virava "NaN:NaN" na tela.
                     */
                    const entradas = (detail?.voiceStates[channel.id] ?? [])
                      .map((v) => v.joinedAt)
                      .filter((t): t is number => Number.isFinite(t));
                    const chamadaDesde = entradas.length ? Math.min(...entradas) : null;

                    return (
                      <div key={channel.id} className="group/canal relative">
                        <button
                          onClick={() => onSelectChannel(channel.id)}
                          className={cn(
                            "mb-0.5 flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm transition",
                            active
                              ? "bg-surface-4 text-ink"
                              : bloqueado
                                ? "text-ink-faint hover:bg-surface-3"
                                : unread
                                  ? "font-semibold text-ink hover:bg-surface-3"
                                  : "text-ink-muted hover:bg-surface-3",
                          )}
                        >
                          {channel.type === "VOICE" ? (
                            /*
                              O cadeado no lugar do alto-falante quando você não
                              pode entrar. Clicar já mostrava a explicação — mas
                              descobrir só DEPOIS de clicar parece que o app
                              falhou, e não que o canal é fechado.
                            */
                            bloqueado ? (
                              <Lock size={18} className="shrink-0 text-ink-faint" />
                            ) : (
                              <Volume2
                                size={18}
                                className={cn(
                                  "shrink-0",
                                  inThisCall ? "text-online" : "text-ink-faint",
                                )}
                              />
                            )
                          ) : channel.type === "FORUM" ? (
                            <MessagesSquare size={18} className="shrink-0 text-ink-faint" />
                          ) : (
                            <Hash size={18} className="shrink-0 text-ink-faint" />
                          )}
                          <span className="truncate">{channel.name}</span>

                          {/*
                            Reserva o espaço da direita. Os indicadores e os
                            botões de ação ocupam ESTA área, um de cada vez —
                            antes os botões eram `absolute` e caíam POR CIMA do
                            ponto de não-lido, que continuava desenhado embaixo.
                          */}
                          <span className="ml-auto flex shrink-0 items-center gap-1.5 group-hover/canal:invisible">
                            {channel.type === "VOICE" && chamadaDesde !== null && !unread && (
                              <CallTimer desde={chamadaDesde} />
                            )}

                            {unread &&
                              (naoLidas > 0 ? (
                                <span
                                  title={mencoes > 0 ? `${mencoes} menção(ões) a você` : undefined}
                                  className={cn(
                                    "min-w-[18px] rounded-full px-1.5 text-center text-[11px] font-bold leading-[18px]",
                                    /**
                                     * Vermelho é para o que é PRA VOCÊ. Antes
                                     * toda mensagem nova era vermelha, e aí o
                                     * vermelho não queria dizer nada — canal
                                     * movimentado ficava aceso o dia inteiro.
                                     */
                                    mencoes > 0
                                      ? "bg-danger text-white"
                                      : "bg-surface-4 text-ink-muted",
                                  )}
                                >
                                  {naoLidas > 99 ? "99+" : naoLidas}
                                </span>
                              ) : (
                                <span className="size-2 rounded-full bg-ink" />
                              ))}
                          </span>
                        </button>

                        <div className="pointer-events-none absolute right-2 top-1.5 flex gap-0.5 opacity-0 transition group-hover/canal:pointer-events-auto group-hover/canal:opacity-100">
                          {channel.type === "VOICE" && (
                            <button
                              onClick={() => onOpenVoiceChat?.(channel.id)}
                              title="Abrir chat"
                              className="rounded p-0.5 text-ink-faint transition hover:text-ink"
                            >
                              <MessageSquare size={14} />
                            </button>
                          )}

                          {/* sem CREATE_INVITE o botão some: mostrar um atalho
                              que o servidor vai recusar só ensina a errar */}
                          {can("CREATE_INVITE") && (
                            <button
                              onClick={() => setInviting(true)}
                              title="Convidar pessoas"
                              className="rounded p-0.5 text-ink-faint transition hover:text-ink"
                            >
                              <UserPlus size={14} />
                            </button>
                          )}

                          {(canManageChannels || canManageRoles) && (
                            <button
                              onClick={() => setEditandoCanal(channel.id)}
                              title="Editar canal"
                              className="rounded p-0.5 text-ink-faint transition hover:text-ink"
                            >
                              <Settings size={14} />
                            </button>
                          )}
                        </div>

                        {channel.type === "VOICE" && (
                          <VoiceMembers
                            states={detail?.voiceStates[channel.id] ?? []}
                            members={detail?.members ?? []}
                            guildId={detail?.guild.id}
                            roles={detail?.roles}
                            canaisDeVoz={channels.filter((c) => c.type === "VOICE")}
                            minhasPermissoes={detail?.permissions}
                            currentUserId={user?.id}
                          />
                        )}
                      </div>
                    );
                  })}
              </section>
            );
          })}
        </div>

        {/*
          O painel se vira sozinho: os dados vêm da CHAMADA, não desta tela. Só
          "está em outra aba" continua vindo daqui, porque é a única parte que
          depende do servidor aberto.
        */}
        <VoicePanel accountChannelId={accountVoiceChannelId} onMoveHere={onMoveCallHere} />

        {user && <UserPanel user={user} onLogout={onLogout} />}
        <AlcaDeLargura borda="direita" arrastando={arrastando} largura={largura} limites={limites} {...alca} />
      </aside>

      <CreateChannelModal
        open={creatingIn !== false}
        guildId={detail?.guild.id}
        categoryId={creatingIn === false ? null : creatingIn}
        onClose={() => setCreatingIn(false)}
      />
      <InviteModal
        open={inviting}
        guildId={detail?.guild.id}
        guildName={detail?.guild.name}
        onClose={() => setInviting(false)}
      />

      {detail &&
        editandoCanal &&
        (() => {
          const canal = channels.find((c) => c.id === editandoCanal);
          if (!canal) return null;

          return (
            <ChannelSettingsModal
              open
              onClose={() => setEditandoCanal(null)}
              guildId={detail.guild.id}
              channel={canal}
              roles={detail.roles}
              members={detail.members}
              minhasPermissoes={detail.permissions}
              canManageChannels={canManageChannels}
              canManageRoles={canManageRoles}
            />
          );
        })()}

      {detail && (
        <ServerSettingsModal
          open={configurando}
          onClose={() => setConfigurando(false)}
          detail={detail}
          members={detail.members}
          currentUserId={user?.id}
          isOwner={isOwner}
          canManage={canManage}
          canManageRoles={canManageRoles}
          canManageWebhooks={canManageWebhooks}
          permissoes={new Set(detail.permissions)}
        />
      )}
    </>
  );
};
