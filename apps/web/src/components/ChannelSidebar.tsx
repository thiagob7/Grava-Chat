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

import type {
  GuildDetailModel,
  GuildSummaryModel,
} from "~/@core/domain/models/guild-model";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { ChannelSettingsModal } from "~/components/channel-settings/ChannelSettingsModal";
import { CreateChannelModal } from "~/components/CreateChannelModal";
import { InviteModal } from "~/components/InviteModal";
import { CallTimer } from "~/components/CallTimer";
import { VoiceMembers } from "~/components/VoiceMembers";
import { useVoiceSync } from "~/hooks/use-voice-sync";
import { ChatsCircle, Hash, SpeakerHigh } from "@phosphor-icons/react";
import { RodapeDaBarra } from "~/components/RodapeDaBarra";
import { useFavoritos } from "~/stores/favoritos";
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
import { useAparencia } from "~/stores/aparencia";
import { useCategoriasFechadas } from "~/hooks/use-categorias-fechadas";
import { useProporcaoDaFaixa } from "~/hooks/use-proporcao-da-faixa";

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

  /// O pedido pode ter nascido no servidor anterior: quem clicou em
  /// "Adicionar emoji" e trocou de servidor no meio do caminho não quer cair
  /// nas configurações deste aqui.
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

  /*
    Favoritos no alto, e o canal continua no lugar de origem.

    Tirar ele da categoria faria a estrela "mover" o canal — e aí favoritar
    viraria uma decisão sobre a organização do servidor, que é de quem manda
    nele. Aqui a estrela só duplica o atalho pra você.
  */
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
    min: 180,
    max: 420,
    borda: "direita",
  });

  const comFaixa = Boolean(detail?.guild.bannerUrl) && faixaDoServidor;

  /*
    A altura da faixa sai da LARGURA da barra dividida pela proporção da
    imagem — e não de um número fixo. A barra é redimensionável: altura fixa
    daria tarja numa largura e corte na outra.
  */
  const proporcao = useProporcaoDaFaixa(comFaixa ? detail?.guild.bannerUrl : null);

  return (
    <>
      {/*
        `canto-do-miolo` e `topo-do-miolo` estão no `index.css`, e só valem
        dentro do aplicativo instalado. A curva é do FUNDO, não um recorte: a
        alça de largura mora em `-right-1`, fora da caixa, e um
        `overflow-hidden` aqui comeria metade da área de pegar.
      */}
      <aside
        className="canto-do-miolo topo-do-miolo relative flex shrink-0 flex-col border-x border-divisor bg-surface-1"
        style={{ width: largura }}
      >
        {/*
          A faixa do servidor e o nome são o MESMO bloco, não dois empilhados.

          Antes eram: uma tira de altura fixa em cima, o cabeçalho embaixo. Duas
          alturas fixas para uma imagem de proporção qualquer — daí a tarja preta
          de quem manda uma faixa mais larga que alta, e o corte pelo meio de
          quem manda uma mais alta.

          Agora a altura sai da LARGURA da barra: a faixa ocupa a proporção
          inteira, e o nome flutua por cima do alto dela. O véu escuro e a sombra
          no texto existem porque a imagem é escolha de quem manda no servidor —
          sem eles, nome branco sobre faixa clara some.
        */}
        <header
          className={cn(
            "regiao-de-arrasto relative flex shrink-0 items-start overflow-hidden border-b border-divisor shadow-sm",
            !comFaixa && "h-12",
          )}
          style={
            comFaixa
              ? {
                  height: largura / proporcao,
                  /*
                    Os limites do Fluxer, só que em CSS: `min-height` vence
                    `max-height` na cascata, então isto é o mesmo que
                    `max(48, min(ideal, 30vh))` — sem precisar de um ouvinte de
                    `resize` para saber a altura da janela.
                  */
                  minHeight: "3rem",
                  maxHeight: "30vh",
                }
              : undefined
          }
        >
          {comFaixa && (
            <>
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-top bg-no-repeat"
                style={{ backgroundImage: `url(${detail!.guild.bannerUrl})` }}
              />
              {/*
                O véu cobre só a faixa de cima, onde o nome mora — escurecer a
                imagem inteira seria estragá-la para proteger uma linha de texto.
              */}
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/30 to-transparent"
              />
            </>
          )}

          <div className="relative z-10 flex h-12 w-full items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!detail}>
              <button
                className={cn(
                  "flex h-full min-w-0 flex-1 items-center gap-1 px-4 text-left transition",
                  /// Sobre a faixa não há realce de passagem: pintar um retângulo
                  /// cinza por cima da imagem é pior que não realçar nada.
                  !comFaixa && "hover:bg-surface-3",
                )}
              >
                <h1
                  className={cn(
                    "truncate font-semibold",
                    comFaixa && "text-white [text-shadow:0_1px_3px_rgb(0_0_0/0.9)]",
                  )}
                >
                  {detail?.guild.name ?? "…"}
                </h1>
                <ChevronDown
                  size={16}
                  className={cn(
                    "shrink-0",
                    comFaixa
                      ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                      : "text-ink-muted",
                  )}
                />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64">
              {can("CREATE_INVITE") && (
                <DropdownMenuItem onSelect={() => setInviting(true)}>
                  Convidar pessoas <UserPlus size={16} />
                </DropdownMenuItem>
              )}

              {podeConfigurar && (
                <DropdownMenuItem
                  onSelect={() => configuracoes.abrir(detail!.guild.id)}
                >
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
                <DropdownMenuItem
                  danger
                  onSelect={() =>
                    configuracoes.abrir(detail!.guild.id, "excluir")
                  }
                >
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
                className={cn(
                  "mr-4 shrink-0 transition",
                  comFaixa
                    ? "text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] hover:text-white/80"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <UserPlus size={18} />
              </button>
            </Tooltip>
          )}
          </div>
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
                          group.id &&
                          setCollapsed({
                            ...collapsed,
                            [group.id]: !collapsed[group.id],
                          })
                        }
                        className="flex flex-1 items-center gap-0.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink-faint transition hover:text-ink"
                      >
                        <ChevronDown
                          size={12}
                          className={isCollapsed ? "-rotate-90" : ""}
                        />
                        <span className="truncate">{group.name}</span>
                      </button>
                      {/*
                      "Favoritos" não é categoria de verdade: criar canal ali
                      mandaria `categoryId: "favoritos"` pra API, que não existe.
                    */}
                      {canManageChannels && group.id !== "favoritos" && (
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
                                <Lock
                                  size={18}
                                  className="shrink-0 text-ink-faint"
                                />
                              ) : (
                                <SpeakerHigh
                                  size={18}
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
                              <ChatsCircle
                                size={18}
                                weight="fill"
                                className="shrink-0 text-ink-faint"
                              />
                            ) : channel.isPrivate ? (
                              /* canal de texto fechado tinha o mesmo `#` de um
                               aberto: quem entra no servidor não tinha como
                               saber por que só enxerga metade da lista */
                              <Lock
                                size={18}
                                className="shrink-0 text-ink-faint"
                              />
                            ) : (
                              <Hash
                                size={18}
                                weight="bold"
                                className="shrink-0 text-ink-faint"
                              />
                            )}
                            <span
                              className="truncate"
                              style={{
                                fontFamily:
                                  familiaDaFonte(channel.fonte) ?? undefined,
                              }}
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
                              {channel.type === "VOICE" &&
                                channel.userLimit > 0 && (
                                  <span
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
                                !unread && <CallTimer desde={chamadaDesde} />}

                              {unread &&
                                (naoLidas > 0 ? (
                                  <span
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
