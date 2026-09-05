import React from "react";
import { Checkbox } from "~/components/ui/checkbox";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import type {
  Channel,
  GuildMember,
  Permission,
  Role,
  VoiceState,
} from "@gravae/shared";
import { has } from "@gravae/shared";

import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import { useSetNickname } from "~/@core/application/queries/moderation/use-moderation";
import {
  kickFromVoice,
  moderateVoice,
  moveMember,
} from "~/@core/lib/websocket/emit-voice";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Slider } from "~/components/ui/slider";
import { useConfirmar } from "~/components/ui/confirm";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useTranslation } from "~/traducao";
import { copiarTexto } from "~/lib/copiar";

interface VoiceMemberMenuProps {
  children: React.ReactNode;
  guildId: string;
  userId: string;
  displayName: string;
  voiceState?: VoiceState;
  member?: GuildMember;
  roles: Role[];
  canaisDeVoz: Channel[];
  minhasPermissoes: Permission[];
  currentUserId: string | undefined;
}

export const VoiceMemberMenu: React.FC<VoiceMemberMenuProps> = ({
  children,
  guildId,
  userId,
  displayName,
  voiceState,
  member,
  roles,
  canaisDeVoz,
  minhasPermissoes,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openDm = useOpenDm();
  const setRoles = useSetMemberRoles(guildId);
  const confirmar = useConfirmar();
  const setNickname = useSetNickname(guildId);

  const volumes = useVoiceStore((s) => s.volumesLocais);
  const setVolumeLocal = useVoiceStore((s) => s.setVolumeLocal);
  const silenciados = useVoiceStore((s) => s.silenciadosLocais);
  const micEnabled = useVoiceStore((s) => s.micEnabled);
  const deafened = useVoiceStore((s) => s.deafened);
  const toggleMic = useVoiceStore((s) => s.toggleMic);
  const toggleDeafen = useVoiceStore((s) => s.toggleDeafen);
  const sair = useVoiceStore((s) => s.leave);
  const toggleSilenciarLocal = useVoiceStore((s) => s.toggleSilenciarLocal);

  const euMesmo = userId === currentUserId;
  const permissoes = new Set(minhasPermissoes);
  const pode = (p: Permission) => has(permissoes as Set<Permission>, p);

  const naChamada = Boolean(voiceState);
  const volume = Math.min(1, volumes[userId] ?? 1);

  return (
    <ContextMenu data-gc="voz.voice-member-menu.context-menu">
      <ContextMenuTrigger data-gc="voz.voice-member-menu.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="voz.voice-member-menu.context-menu-content">
        <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item" onSelect={() => navigate(`/channels/${guildId}`)}>
          {euMesmo ? "Ver meu perfil" : "Perfil"}
        </ContextMenuItem>

        {euMesmo && (
          <>
            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--2"
              disabled={!pode("CHANGE_NICKNAME") && !pode("MANAGE_NICKNAMES")}
              onSelect={() =>
                void confirmar({
                  titulo: t("chamada.membro.apelidoTitulo"),
                  descricao: t("chamada.membro.apelidoDicaPropria"),
                  acao: t("comum.salvar"),
                  destrutivo: false,
                  campo: { rotulo: t("chamada.membro.apelidoCampo"), placeholder: displayName },
                }).then(
                  ({ confirmado, texto }) =>
                    confirmado &&
                    setNickname.mutate({
                      guildId,
                      userId,
                      nickname: texto || null,
                    }),
                )
              }
            >
              {t("chamada.membro.mudarMeuApelido")}
            </ContextMenuItem>

            {naChamada && (
              <>
                <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator" />

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--3"
                  onSelect={(e) => {
                    e.preventDefault();
                    void toggleMic();
                  }}
                >
                  {t("chamada.membro.meuMicrofone")}
                  <Checkbox data-gc="voz.voice-member-menu.checkbox" readOnly checked={micEnabled} />
                </ContextMenuItem>

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--4"
                  onSelect={(e) => {
                    e.preventDefault();
                    void toggleDeafen();
                  }}
                >
                  {t("chamada.membro.ouvirChamada")}
                  <Checkbox data-gc="voz.voice-member-menu.checkbox--2" readOnly checked={!deafened} />
                </ContextMenuItem>

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--5"
                  className="text-danger"
                  onSelect={() => void sair()}
                >
                  {t("chamada.sair")}
                </ContextMenuItem>
              </>
            )}

            <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--2" />

            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--6"
              onSelect={() => {
                void copiarTexto(userId);
                toast.success(t("chamada.membro.idCopiado"));
              }}
            >
              {t("chamada.membro.copiarMeuId")}
            </ContextMenuItem>
          </>
        )}

        {!euMesmo && (
          <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--7"
            onSelect={() =>
              openDm.mutate(userId, {
                onSuccess: (canal) => navigate(`/dm/${canal.id}`),
              })
            }
          >
            Mensagem
          </ContextMenuItem>
        )}

        {!euMesmo && naChamada && (
          <>
            <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--3" />
            <ContextMenuLabel data-gc="voz.voice-member-menu.context-menu-label">
              Volume · {Math.round(volume * 100)}%
            </ContextMenuLabel>
            <div data-gc="voz.voice-member-menu.div"
              className="px-2.5 pb-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Slider data-gc="voz.voice-member-menu.slider"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                preenchido={volume}
                onChange={(e) => setVolumeLocal(userId, Number(e.target.value))}
              />
            </div>

            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--8"
              onSelect={(e) => {
                e.preventDefault();
                toggleSilenciarLocal(userId);
              }}
            >
              {t("chamada.membro.silenciar")}
              <Checkbox data-gc="voz.voice-member-menu.checkbox--3" readOnly checked={Boolean(silenciados[userId])} />
            </ContextMenuItem>
          </>
        )}

        {!euMesmo && (
          <>
            <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--4" />

            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--9"
              disabled={!pode("MANAGE_NICKNAMES")}
              onSelect={() =>
                void confirmar({
                  titulo: t("chamada.membro.apelidoDeAlguem", { nome: displayName }),
                  descricao: t("chamada.membro.apelidoDicaDeOutro"),
                  acao: t("comum.salvar"),
                  destrutivo: false,
                  campo: { rotulo: t("chamada.membro.apelidoCampo"), placeholder: displayName },
                }).then(
                  ({ confirmado, texto }) =>
                    confirmado &&
                    setNickname.mutate({
                      guildId,
                      userId,
                      nickname: texto || null,
                    }),
                )
              }
            >
              {t("chamada.membro.alterarApelido")}
            </ContextMenuItem>

            {pode("MANAGE_ROLES") && (
              <ContextMenuSub data-gc="voz.voice-member-menu.context-menu-sub">
                <ContextMenuSubTrigger data-gc="voz.voice-member-menu.context-menu-sub-trigger">{t("chamada.membro.cargos")}</ContextMenuSubTrigger>
                <ContextMenuSubContent data-gc="voz.voice-member-menu.context-menu-sub-content">
                  {roles
                    .filter((r) => !r.isEveryone)
                    .map((role) => {
                      const tem = member?.roleIds.includes(role.id) ?? false;

                      return (
                        <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--10"
                          key={role.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            const roleIds = tem
                              ? (member?.roleIds ?? []).filter(
                                  (id) => id !== role.id,
                                )
                              : [...(member?.roleIds ?? []), role.id];

                            setRoles.mutate({ guildId, userId, roleIds });
                          }}
                        >
                          <span data-gc="voz.voice-member-menu.span" className="flex items-center gap-2">
                            <span data-gc="voz.voice-member-menu.span--2"
                              className="size-2.5 rounded-full"
                              style={{
                                backgroundColor: role.color ?? "#99aab5",
                              }}
                            />
                            {role.name}
                          </span>
                          <Checkbox data-gc="voz.voice-member-menu.checkbox--4" readOnly checked={tem} />
                        </ContextMenuItem>
                      );
                    })}

                  {roles.filter((r) => !r.isEveryone).length === 0 && (
                    <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--11" disabled>
                      {t("chamada.membro.semCargo")}
                    </ContextMenuItem>
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {naChamada && pode("MOVE_MEMBERS") && (
              <ContextMenuSub data-gc="voz.voice-member-menu.context-menu-sub--2">
                <ContextMenuSubTrigger data-gc="voz.voice-member-menu.context-menu-sub-trigger--2">{t("chamada.membro.moverPara")}</ContextMenuSubTrigger>
                <ContextMenuSubContent data-gc="voz.voice-member-menu.context-menu-sub-content--2">
                  {canaisDeVoz
                    .filter((c) => c.id !== voiceState?.channelId)
                    .map((canal) => (
                      <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--12"
                        key={canal.id}
                        onSelect={() =>
                          void moveMember(userId, canal.id).catch((e: Error) =>
                            toast.error(e.message),
                          )
                        }
                      >
                        {canal.name}
                      </ContextMenuItem>
                    ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {naChamada && (
              <>
                <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--5" />

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--13"
                  disabled={!pode("MUTE_MEMBERS")}
                  danger={voiceState?.serverMute}
                  onSelect={(e) => {
                    e.preventDefault();
                    void moderateVoice({
                      userId,
                      serverMute: !voiceState?.serverMute,
                    }).catch((erro: Error) => toast.error(erro.message));
                  }}
                >
                  {t("chamada.membro.silenciarNoServidor")}
                  <Checkbox data-gc="voz.voice-member-menu.checkbox--5"
                    readOnly
                    checked={Boolean(voiceState?.serverMute)}
                  />
                </ContextMenuItem>

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--14"
                  disabled={!pode("DEAFEN_MEMBERS")}
                  danger={voiceState?.serverDeaf}
                  onSelect={(e) => {
                    e.preventDefault();
                    void moderateVoice({
                      userId,
                      serverDeaf: !voiceState?.serverDeaf,
                    }).catch((erro: Error) => toast.error(erro.message));
                  }}
                >
                  {t("chamada.membro.desativarAudioNoServidor")}
                  <Checkbox data-gc="voz.voice-member-menu.checkbox--6"
                    readOnly
                    checked={Boolean(voiceState?.serverDeaf)}
                  />
                </ContextMenuItem>

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--15"
                  danger
                  disabled={!pode("MOVE_MEMBERS")}
                  onSelect={() =>
                    void kickFromVoice(userId).catch((erro: Error) =>
                      toast.error(erro.message),
                    )
                  }
                >
                  {t("chamada.membro.desconectar")}
                </ContextMenuItem>
              </>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
