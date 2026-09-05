import React, { useEffect, useState } from "react";
import { ChevronDown, Lock, LogOut, Plus, Settings, Trash2 } from "lucide-react";

import type {
  GuildDetailModel,
  GuildSummaryModel,
} from "~/@core/domain/models/guild-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { ChannelSettingsModal } from "~/features/servidor/components/channel-settings/ChannelSettingsModal";
import { CreateChannelModal } from "~/features/servidor/components/CreateChannelModal";
import { InviteModal } from "~/features/servidor/components/InviteModal";
import { CallTimer } from "~/features/voz/components/CallTimer";
import { VoiceMembers } from "~/features/voz/components/VoiceMembers";
import { useVoiceSync } from "~/features/voz/hooks/use-voice-sync";
import {
  CaretDown,
  ChatCircle,
  ChatsCircle,
  GearSix,
  Hash,
  SpeakerHigh,
  UserPlus,
} from "@phosphor-icons/react";
import { RodapeDaBarra } from "~/features/app/components/RodapeDaBarra";
import { useFavoritos } from "~/features/servidor/stores/favoritos";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ServerSettingsModal } from "~/features/servidor/components/server-settings/ServerSettingsModal";
import { Tooltip } from "~/components/ui/tooltip";
import { usePermissions } from "~/hooks/use-permissions";
import { copiarTexto } from "~/lib/copiar";
import { carregarFonte, familiaDaFonte } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { toast } from "react-toastify";
import { useServerSettingsStore } from "~/features/servidor/stores/server-settings-store";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useCategoriasFechadas } from "~/features/servidor/hooks/use-categorias-fechadas";
import { useProporcaoDaFaixa } from "~/features/servidor/hooks/use-proporcao-da-faixa";
import { flx } from "~/lib/compat-fluxer";
import { flxCls } from "~/lib/compat-fluxer";

interface ChannelSidebarProps {
  detail: GuildDetailModel | undefined;
  summary: GuildSummaryModel | undefined;
  activeChannelId: string | undefined;
  readStates: Record<
    string,
    { lido: string | null; naoLidas: number; mencoes: number }
  >;
  user: SelfUserModel | null;
  onSelectChannel: (channelId: string) => void;
  onLogout: () => void;
  accountVoiceChannelId: string | null;
  onLeaveGuild: () => void;
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
  onLeaveGuild,
  onOpenVoiceChat,
}) => {
  const voiceChannelId = useVoiceStore((s) => s.channelId);
  const faixaDoServidor = useAparencia((s) => s.faixaDoServidor);
  const [collapsed, setCollapsed] = useCategoriasFechadas();
  const [creatingIn, setCreatingIn] = useState<string | null | false>(false);
  const [inviting, setInviting] = useState(false);
  const configuracoes = useServerSettingsStore();

  const configurando =
    configuracoes.aberto && configuracoes.guildId === detail?.guild.id;
  const [editandoCanal, setEditandoCanal] = useState<string | null>(null);

  const { can, canInChannel } = usePermissions(detail);

  useVoiceSync(detail?.guild.id, user?.id);
  const canManage = can("MANAGE_GUILD");
  const canManageChannels = can("MANAGE_CHANNELS");
  const canManageRoles = can("MANAGE_ROLES");
  const canManageWebhooks = can("MANAGE_WEBHOOKS");
  const podeConfigurar = canManage || canManageRoles || canManageWebhooks;
  const isOwner = Boolean(summary?.isOwner);
  const channels = detail?.channels ?? [];

  useEffect(() => {
    channels.forEach((c) => carregarFonte(c.fonte));
  }, [channels]);
  const uncategorized = channels.filter((c) => !c.categoryId);

  const favoritos = useFavoritos((s) => s.canais);
  const canaisFavoritos = channels.filter((c) => favoritos.includes(c.id));

  const groups = [
    ...(canaisFavoritos.length
      ? [{ id: "favoritos", name: "Favoritos", channels: canaisFavoritos }]
      : []),
    ...(uncategorized.length
      ? [{ id: null, name: null, channels: uncategorized }]
      : []),
    ...(detail?.categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      channels: channels.filter((c) => c.categoryId === category.id),
    })),
  ];

  const { largura, arrastando, alca, limites } = useLarguraAjustavel("canais", {
    padrao: 240,
    token: "--layout-sidebar-width",
    min: 180,
    max: 420,
    borda: "direita",
  });

  const comFaixa = Boolean(detail?.guild.bannerUrl) && faixaDoServidor;

  const proporcao = useProporcaoDaFaixa(comFaixa ? detail?.guild.bannerUrl : null);

  return (
    <>
      <aside data-gc="servidor.channel-sidebar.aside"
        {...flx("listaDeCanais", "lista-de-canais canto-do-miolo topo-do-miolo relative flex shrink-0 flex-col border-x border-divisor bg-surface-1")}
        style={{ width: largura }}
      >
        <header data-gc="servidor.channel-sidebar.header"
          className={cn(
            "regiao-de-arrasto relative flex shrink-0 items-start overflow-hidden border-b border-divisor shadow-sm",
            !comFaixa && "h-[var(--layout-header-height)]",
          )}
          style={
            comFaixa
              ? {
                  height: largura / proporcao,
                  minHeight: "var(--layout-header-height)",
                  maxHeight: "30vh",
                }
              : undefined
          }
        >
          {comFaixa && (
            <>
              <div data-gc="servidor.channel-sidebar.div"
                aria-hidden
                className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                style={{ backgroundImage: `url(${detail!.guild.bannerUrl})` }}
              />
              <div data-gc="servidor.channel-sidebar.div--2"
                aria-hidden
                className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/30 to-transparent"
              />
            </>
          )}

          <div data-gc="servidor.channel-sidebar.div--3" className="relative z-10 flex h-[var(--layout-header-height)] w-full items-center justify-between px-2">
          <DropdownMenu data-gc="servidor.channel-sidebar.dropdown-menu">
            <DropdownMenuTrigger data-gc="servidor.channel-sidebar.dropdown-menu-trigger" asChild disabled={!detail}>
              <button data-gc="servidor.channel-sidebar.button"
                className={cn(
                  "group/nome flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-left transition",
                  comFaixa
                    ? "hover:bg-black/35 data-[state=open]:bg-black/35"
                    : "hover:bg-surface-3 data-[state=open]:bg-surface-3",
                )}
              >
                <h1 data-gc="servidor.channel-sidebar.h1"
                  className={cn(
                    "truncate font-semibold",
                    comFaixa && "text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]",
                  )}
                >
                  {detail?.guild.name ?? "…"}
                </h1>
                <ChevronDown data-gc="servidor.channel-sidebar.chevron-down"
                  size={16}
                  className={cn(
                    "shrink-0 transition-transform duration-150 group-data-[state=open]/nome:rotate-180",
                    comFaixa
                      ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                      : "text-ink-muted",
                  )}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="servidor.channel-sidebar.dropdown-menu-content" align="start" className="w-64">
              {can("CREATE_INVITE") && (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item" onSelect={() => setInviting(true)}>
                  Convidar pessoas <UserPlus data-gc="servidor.channel-sidebar.user-plus" size={16} />
                </DropdownMenuItem>
              )}

              {podeConfigurar && (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--2"
                  onSelect={() => configuracoes.abrir(detail!.guild.id)}
                >
                  Configurações do servidor <Settings data-gc="servidor.channel-sidebar.settings" size={16} />
                </DropdownMenuItem>
              )}

              {canManageChannels && (
                <>
                  <DropdownMenuSeparator data-gc="servidor.channel-sidebar.dropdown-menu-separator" />
                  <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--3" onSelect={() => setCreatingIn(null)}>
                    Criar canal <Plus data-gc="servidor.channel-sidebar.plus" size={16} />
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator data-gc="servidor.channel-sidebar.dropdown-menu-separator--2" />
              <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--4"
                onSelect={() => {
                  void copiarTexto(detail?.guild.id ?? "");
                  toast.success("ID copiado.");
                }}
              >
                Copiar ID do servidor
              </DropdownMenuItem>

              <DropdownMenuSeparator data-gc="servidor.channel-sidebar.dropdown-menu-separator--3" />
              {isOwner ? (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--5"
                  danger
                  onSelect={() =>
                    configuracoes.abrir(detail!.guild.id, "excluir")
                  }
                >
                  Excluir servidor <Trash2 data-gc="servidor.channel-sidebar.trash2" size={16} />
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem data-gc="servidor.channel-sidebar.dropdown-menu-item--6" danger onSelect={() => onLeaveGuild()}>
                  Sair do servidor <LogOut data-gc="servidor.channel-sidebar.log-out" size={16} />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {detail && can("CREATE_INVITE") && (
            <Tooltip data-gc="servidor.channel-sidebar.tooltip" label="Convidar amigos">
              <button data-gc="servidor.channel-sidebar.button--2"
                onClick={() => setInviting(true)}
                className={cn(
                  "shrink-0 rounded-lg p-1.5 transition",
                  comFaixa
                    ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:text-white/80"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <UserPlus data-gc="servidor.channel-sidebar.user-plus--2" size={18} weight="fill" />
              </button>
            </Tooltip>
          )}
          </div>
        </header>

        <div data-gc="servidor.channel-sidebar.div--4" className="relative flex min-h-0 flex-1 flex-col">
          <div data-gc="servidor.channel-sidebar.div--5" className="flex-1 overflow-y-auto px-2 py-3">
            {groups.map((group) => {
              const isCollapsed = group.id ? collapsed[group.id] : false;

              return (
                <section data-gc="servidor.channel-sidebar.section" key={group.id ?? "sem-categoria"} className="mb-4">
                  {group.name && (
                    <div data-gc="servidor.channel-sidebar.div--6" className="group flex items-center justify-between px-1">
                      <button data-gc="servidor.channel-sidebar.button--3"
                        onClick={() =>
                          group.id &&
                          setCollapsed({
                            ...collapsed,
                            [group.id]: !collapsed[group.id],
                          })
                        }
                        className="flex flex-1 items-center gap-1 py-1.5 text-sm font-semibold leading-5 text-ink-faint transition hover:text-ink"
                      >
                        <CaretDown data-gc="servidor.channel-sidebar.caret-down"
                          size={12}
                          weight="bold"
                          className={cn("shrink-0 transition-transform", isCollapsed && "-rotate-90")}
                        />
                        <span data-gc="servidor.channel-sidebar.span" className="truncate">{group.name}</span>
                      </button>
                      {canManageChannels && group.id !== "favoritos" && (
                        <button data-gc="servidor.channel-sidebar.button--4"
                          onClick={() => setCreatingIn(group.id)}
                          title="Criar canal"
                          className="text-ink-faint opacity-0 transition hover:text-ink group-hover:opacity-100"
                        >
                          <Plus data-gc="servidor.channel-sidebar.plus--2" size={16} />
                        </button>
                      )}
                    </div>
                  )}

                  {!isCollapsed &&
                    group.channels.map((channel) => {
                      const active = channel.id === activeChannelId;
                      const leitura = readStates[channel.id];
                      const unread =
                        !active &&
                        channel.lastMessageId &&
                        channel.lastMessageId !== leitura?.lido;
                      const naoLidas = unread ? (leitura?.naoLidas ?? 0) : 0;
                      const mencoes = unread ? (leitura?.mencoes ?? 0) : 0;
                      const inThisCall = voiceChannelId === channel.id;
                      const bloqueado =
                        channel.type === "VOICE" &&
                        !canInChannel(channel.id, "CONNECT");

                      const entradas = (detail?.voiceStates[channel.id] ?? [])
                        .map((v) => v.joinedAt)
                        .filter((t): t is number => Number.isFinite(t));
                      const chamadaDesde = entradas.length
                        ? Math.min(...entradas)
                        : null;

                      return (
                        <div data-gc="servidor.channel-sidebar.div--7" key={channel.id} className="group/canal relative">
                          <button data-gc="servidor.channel-sidebar.button--5"
                            onClick={() => onSelectChannel(channel.id)}
                            className={cn(
                              "mb-0.5 flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-base font-medium leading-5 transition",
                              active
                                ? cn("bg-selecionado text-ink", flxCls("itemDeCanalAtivo"))
                                : bloqueado
                                  ? "text-ink-faint hover:bg-hover"
                                  : unread
                                    ? "font-semibold text-ink hover:bg-hover"
                                    : "text-ink-faint hover:bg-hover hover:text-ink",
                            )}
                          >
                            {channel.type === "VOICE" ? (
                              bloqueado ? (
                                <Lock data-gc="servidor.channel-sidebar.lock"
                                  size={20}
                                  className="shrink-0 text-ink-faint"
                                />
                              ) : (
                                <SpeakerHigh data-gc="servidor.channel-sidebar.speaker-high"
                                  size={20}
                                  weight="fill"
                                  className={cn(
                                    "shrink-0",
                                    inThisCall
                                      ? "text-online"
                                      : "text-ink-faint",
                                  )}
                                />
                              )
                            ) : channel.type === "FORUM" ? (
                              <ChatsCircle data-gc="servidor.channel-sidebar.chats-circle"
                                size={20}
                                weight="fill"
                                className="shrink-0 text-ink-faint"
                              />
                            ) : channel.isPrivate ? (
                              <Lock data-gc="servidor.channel-sidebar.lock--2"
                                size={20}
                                className="shrink-0 text-ink-faint"
                              />
                            ) : (
                              <Hash data-gc="servidor.channel-sidebar.hash"
                                size={20}
                                weight="bold"
                                className="shrink-0 text-ink-faint"
                              />
                            )}
                            <span data-gc="servidor.channel-sidebar.span--2"
                              className="truncate"
                              style={{
                                fontFamily:
                                  familiaDaFonte(channel.fonte) ?? undefined,
                              }}
                            >
                              {channel.name}
                            </span>

                            <span data-gc="servidor.channel-sidebar.span--3" className="ml-auto flex shrink-0 items-center gap-1.5 group-hover/canal:invisible">
                              {channel.type === "VOICE" &&
                                channel.userLimit > 0 && (
                                  <span data-gc="servidor.channel-sidebar.span--4"
                                    title={`${entradas.length} de ${channel.userLimit}`}
                                    className={cn(
                                      "text-11 font-medium tabular-nums",
                                      entradas.length >= channel.userLimit
                                        ? "text-danger"
                                        : "text-ink-faint",
                                    )}
                                  >
                                    {entradas.length}/{channel.userLimit}
                                  </span>
                                )}

                              {channel.type === "VOICE" &&
                                chamadaDesde !== null &&
                                !unread && <CallTimer data-gc="servidor.channel-sidebar.call-timer" desde={chamadaDesde} />}

                              {unread &&
                                (naoLidas > 0 ? (
                                  <span data-gc="servidor.channel-sidebar.span--5"
                                    title={
                                      mencoes > 0
                                        ? `${mencoes} menção(ões) a você`
                                        : undefined
                                    }
                                    className={cn(
                                      "min-w-[18px] rounded-full px-1.5 text-center text-11 font-bold leading-[18px]",
                                      mencoes > 0
                                        ? "bg-danger text-white"
                                        : "bg-selecionado text-ink-muted",
                                    )}
                                  >
                                    {naoLidas > 99 ? "99+" : naoLidas}
                                  </span>
                                ) : (
                                  <span data-gc="servidor.channel-sidebar.span--6" className="size-2 rounded-full bg-ink" />
                                ))}
                            </span>
                          </button>

                          <div data-gc="servidor.channel-sidebar.div--8" className="pointer-events-none absolute right-2 top-1.5 flex gap-0.5 opacity-0 transition group-hover/canal:pointer-events-auto group-hover/canal:opacity-100">
                            {channel.type === "VOICE" && (
                              <button data-gc="servidor.channel-sidebar.button--6"
                                onClick={() => onOpenVoiceChat?.(channel.id)}
                                title="Abrir chat"
                                className="rounded p-0.5 text-ink-faint transition hover:text-ink"
                              >
                                <ChatCircle data-gc="servidor.channel-sidebar.chat-circle" size={16} weight="fill" />
                              </button>
                            )}

                            {can("CREATE_INVITE") && (
                              <button data-gc="servidor.channel-sidebar.button--7"
                                onClick={() => setInviting(true)}
                                title="Convidar pessoas"
                                className="rounded p-0.5 text-ink-faint transition hover:text-ink"
                              >
                                <UserPlus data-gc="servidor.channel-sidebar.user-plus--3" size={16} weight="fill" />
                              </button>
                            )}

                            {(canManageChannels || canManageRoles) && (
                              <button data-gc="servidor.channel-sidebar.button--8"
                                onClick={() => setEditandoCanal(channel.id)}
                                title="Editar canal"
                                className="rounded p-0.5 text-ink-faint transition hover:text-ink"
                              >
                                <GearSix data-gc="servidor.channel-sidebar.gear-six" size={16} weight="fill" />
                              </button>
                            )}
                          </div>

                          {channel.type === "VOICE" && (
                            <VoiceMembers data-gc="servidor.channel-sidebar.voice-members"
                              states={detail?.voiceStates[channel.id] ?? []}
                              members={detail?.members ?? []}
                              guildId={detail?.guild.id}
                              roles={detail?.roles}
                              canaisDeVoz={channels.filter(
                                (c) => c.type === "VOICE",
                              )}
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

          <AlcaDeLargura data-gc="servidor.channel-sidebar.alca-de-largura"
            borda="direita"
            arrastando={arrastando}
            largura={largura}
            limites={limites}
            {...alca}
          />
        </div>

        <RodapeDaBarra data-gc="servidor.channel-sidebar.rodape-da-barra.on-logout"
          user={user}
          guildId={detail?.guild.id}
          onLogout={onLogout}
          accountChannelId={accountVoiceChannelId}
        />
      </aside>

      <CreateChannelModal data-gc="servidor.channel-sidebar.create-channel-modal"
        open={creatingIn !== false}
        guildId={detail?.guild.id}
        categoryId={creatingIn === false ? null : creatingIn}
        onClose={() => setCreatingIn(false)}
      />
      <InviteModal data-gc="servidor.channel-sidebar.invite-modal"
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
            <ChannelSettingsModal data-gc="servidor.channel-sidebar.channel-settings-modal"
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
        <ServerSettingsModal data-gc="servidor.channel-sidebar.server-settings-modal.fechar"
          open={configurando}
          onClose={configuracoes.fechar}
          secaoInicial={configuracoes.secao}
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
