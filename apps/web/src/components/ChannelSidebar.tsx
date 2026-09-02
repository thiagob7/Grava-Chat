import React, { useEffect, useState } from "react";
import {
  ChevronDown,

  Lock,
  LogOut,
  MessageSquare,

  Plus,
  Settings,
  Trash2,
  UserPlus,

} from "lucide-react";

import type { GuildDetailModel, GuildSummaryModel } from "~/@core/domain/models/guild-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { ChannelSettingsModal } from "~/components/channel-settings/ChannelSettingsModal";
import { CreateChannelModal } from "~/components/CreateChannelModal";
import { InviteModal } from "~/components/InviteModal";
import { CallTimer } from "~/components/CallTimer";
import { VoiceMembers } from "~/components/VoiceMembers";
import { useVoiceSync } from "~/hooks/use-voice-sync";
import { ChatsCircle, Hash, SpeakerHigh } from "@phosphor-icons/react";
import { RodapeDaBarra } from "~/components/RodapeDaBarra";
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
import { carregarFonte, familiaDaFonte } from "~/lib/cosmeticos/fontes";
import { cn } from "~/lib/utils";
import { toast } from "react-toastify";
import { useServerSettingsStore } from "~/stores/server-settings-store";
import { useVoiceStore } from "~/stores/voice-store";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";

interface ChannelSidebarProps {
  detail: GuildDetailModel | undefined;
  summary: GuildSummaryModel | undefined;
  activeChannelId: string | undefined;
  readStates: Record<string, { lido: string | null; naoLidas: number; mencoes: number }>;
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
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [creatingIn, setCreatingIn] = useState<string | null | false>(false);
  const [inviting, setInviting] = useState(false);
  const configuracoes = useServerSettingsStore();

  /// O pedido pode ter nascido no servidor anterior: quem clicou em
  /// "Adicionar emoji" e trocou de servidor no meio do caminho não quer cair
  /// nas configurações deste aqui.
  const configurando = configuracoes.aberto && configuracoes.guildId === detail?.guild.id;
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
        className="relative flex shrink-0 flex-col border-r border-divisor bg-surface-1"
        style={{ width: largura }}
      >
        {/*
          A faixa do servidor, quando existe: uma imagem larga no alto da
          lista. O nome continua logo abaixo — pôr o nome POR
          CIMA da imagem funciona só enquanto a imagem é escura, e a escolha
          da imagem é de quem manda no servidor, não nossa.
        */}
        {detail?.guild.bannerUrl && (
          <div
            aria-hidden
            className="h-28 shrink-0 border-b border-line bg-cover bg-center"
            style={{ backgroundImage: `url(${detail.guild.bannerUrl})` }}
          />
        )}

        <header className="regiao-de-arrasto flex h-12 items-center justify-between border-b border-divisor shadow-sm">
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
                <DropdownMenuItem onSelect={() => configuracoes.abrir(detail!.guild.id)}>
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
                <DropdownMenuItem danger onSelect={() => configuracoes.abrir(detail!.guild.id, "excluir")}>
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

        {/*
          Cabeçalho e lista dentro de um mesmo bloco relativo: é a altura DELE
          que a alça de arrastar ocupa, e por isso o fio para onde o cartão do
          rodapé começa.
        */}
        <div className="relative flex min-h-0 flex-1 flex-col">
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
                    const mencoes = unread ? (leitura?.mencoes ?? 0) : 0;
                    const inThisCall = voiceChannelId === channel.id;
                    const bloqueado =
                      channel.type === "VOICE" && !canInChannel(channel.id, "CONNECT");

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
                              ? "bg-selecionado text-ink"
                              : bloqueado
                                ? "text-ink-faint hover:bg-surface-3"
                                : unread
                                  ? "font-semibold text-ink hover:bg-surface-3"
                                  : "text-ink-muted hover:bg-surface-3",
                          )}
                        >
                          {channel.type === "VOICE" ? (
                            bloqueado ? (
                              <Lock size={18} className="shrink-0 text-ink-faint" />
                            ) : (
                              <SpeakerHigh
                                size={18}
                                weight="fill"
                                className={cn(
                                  "shrink-0",
                                  inThisCall ? "text-online" : "text-ink-faint",
                                )}
                              />
                            )
                          ) : channel.type === "FORUM" ? (
                            <ChatsCircle size={18} weight="fill" className="shrink-0 text-ink-faint" />
                          ) : channel.isPrivate ? (
                            /* canal de texto fechado tinha o mesmo `#` de um
                               aberto: quem entra no servidor não tinha como
                               saber por que só enxerga metade da lista */
                            <Lock size={18} className="shrink-0 text-ink-faint" />
                          ) : (
                            <Hash size={18} weight="bold" className="shrink-0 text-ink-faint" />
                          )}
                          <span
                            className="truncate"
                            style={{ fontFamily: familiaDaFonte(channel.fonte) ?? undefined }}
                          >
                            {channel.name}
                          </span>

                          <span className="ml-auto flex shrink-0 items-center gap-1.5 group-hover/canal:invisible">
                            {/*
                              A lotação, quando o canal tem limite.

                              O `userLimit` existia no banco e na tela de
                              configuração, e em lugar nenhum onde ele importa:
                              não dava pra saber se um canal estava cheio sem
                              tentar entrar e ser recusado.

                              Só aparece com limite definido — `0` é "sem
                              limite", e "3/0" não diria nada.
                            */}
                            {channel.type === "VOICE" && channel.userLimit > 0 && (
                              <span
                                title={`${entradas.length} de ${channel.userLimit}`}
                                className={cn(
                                  "text-[11px] font-medium tabular-nums",
                                  entradas.length >= channel.userLimit
                                    ? "text-danger"
                                    : "text-ink-faint",
                                )}
                              >
                                {entradas.length}/{channel.userLimit}
                              </span>
                            )}

                            {channel.type === "VOICE" && chamadaDesde !== null && !unread && (
                              <CallTimer desde={chamadaDesde} />
                            )}

                            {unread &&
                              (naoLidas > 0 ? (
                                <span
                                  title={mencoes > 0 ? `${mencoes} menção(ões) a você` : undefined}
                                  className={cn(
                                    "min-w-[18px] rounded-full px-1.5 text-center text-[11px] font-bold leading-[18px]",
                                    mencoes > 0
                                      ? "bg-danger text-white"
                                      : "bg-selecionado text-ink-muted",
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

          <AlcaDeLargura
            borda="direita"
            arrastando={arrastando}
            largura={largura}
            limites={limites}
            {...alca}
          />
        </div>

        <RodapeDaBarra
          user={user}
          guildId={detail?.guild.id}
          onLogout={onLogout}
          accountChannelId={accountVoiceChannelId}
        />
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
