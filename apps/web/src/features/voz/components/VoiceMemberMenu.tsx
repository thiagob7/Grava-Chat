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
import { useConfirm } from "~/components/ui/confirm";
import { useVoiceStore } from "~/features/voz/stores/voice-store";
import { useTranslation } from "~/traducao";
import { copyText } from "~/lib/copiar";

interface VoiceMemberMenuProps {
  children: React.ReactNode;
  guildId: string;
  userId: string;
  displayName: string;
  voiceState?: VoiceState;
  member?: GuildMember;
  roles: Role[];
  voiceChannels: Channel[];
  minePermissions: Permission[];
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
  voiceChannels,
  minePermissions,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const openDm = useOpenDm();
  const setRoles = useSetMemberRoles(guildId);
  const confirm = useConfirm();
  const setNickname = useSetNickname(guildId);

  const volumes = useVoiceStore((s) => s.volumesLocal);
  const setVolumeLocal = useVoiceStore((s) => s.setVolumeLocal);
  const mutedIds = useVoiceStore((s) => s.mutedLocal);
  const micEnabled = useVoiceStore((s) => s.micEnabled);
  const deafened = useVoiceStore((s) => s.deafened);
  const toggleMic = useVoiceStore((s) => s.toggleMic);
  const toggleDeafen = useVoiceStore((s) => s.toggleDeafen);
  const leave = useVoiceStore((s) => s.leave);
  const toggleMuteLocal = useVoiceStore((s) => s.toggleMuteLocal);

  const euSame = userId === currentUserId;
  const permissions = new Set(minePermissions);
  const can = (p: Permission) => has(permissions as Set<Permission>, p);

  const inCall = Boolean(voiceState);
  const volume = Math.min(1, volumes[userId] ?? 1);

  return (
    <ContextMenu data-gc="voz.voice-member-menu.context-menu">
      <ContextMenuTrigger data-gc="voz.voice-member-menu.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="voz.voice-member-menu.context-menu-content">
        <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item" onSelect={() => navigate(`/channels/${guildId}`)}>
          {euSame ? "Ver meu perfil" : "Perfil"}
        </ContextMenuItem>

        {euSame && (
          <>
            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--2"
              disabled={!can("CHANGE_NICKNAME") && !can("MANAGE_NICKNAMES")}
              onSelect={() =>
                void confirm({
                  title: t("chamada.membro.apelidoTitulo"),
                  description: t("chamada.membro.apelidoDicaPropria"),
                  action: t("comum.salvar"),
                  destructive: false,
                  field: { label: t("chamada.membro.apelidoCampo"), placeholder: displayName },
                }).then(
                  ({ confirmed, text }) =>
                    confirmed &&
                    setNickname.mutate({
                      guildId,
                      userId,
                      nickname: text || null,
                    }),
                )
              }
            >
              {t("chamada.membro.mudarMeuApelido")}
            </ContextMenuItem>

            {inCall && (
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
                  onSelect={() => void leave()}
                >
                  {t("chamada.sair")}
                </ContextMenuItem>
              </>
            )}

            <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--2" />

            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--6"
              onSelect={() => {
                void copyText(userId);
                toast.success(t("chamada.membro.idCopiado"));
              }}
            >
              {t("chamada.membro.copiarMeuId")}
            </ContextMenuItem>
          </>
        )}

        {!euSame && (
          <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--7"
            onSelect={() =>
              openDm.mutate(userId, {
                onSuccess: (channel) => navigate(`/dm/${channel.id}`),
              })
            }
          >
            Mensagem
          </ContextMenuItem>
        )}

        {!euSame && inCall && (
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
                filled={volume}
                onChange={(e) => setVolumeLocal(userId, Number(e.target.value))}
              />
            </div>

            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--8"
              onSelect={(e) => {
                e.preventDefault();
                toggleMuteLocal(userId);
              }}
            >
              {t("chamada.membro.silenciar")}
              <Checkbox data-gc="voz.voice-member-menu.checkbox--3" readOnly checked={Boolean(mutedIds[userId])} />
            </ContextMenuItem>
          </>
        )}

        {!euSame && (
          <>
            <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--4" />

            <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--9"
              disabled={!can("MANAGE_NICKNAMES")}
              onSelect={() =>
                void confirm({
                  title: t("chamada.membro.apelidoDeAlguem", { nome: displayName }),
                  description: t("chamada.membro.apelidoDicaDeOutro"),
                  action: t("comum.salvar"),
                  destructive: false,
                  field: { label: t("chamada.membro.apelidoCampo"), placeholder: displayName },
                }).then(
                  ({ confirmed, text }) =>
                    confirmed &&
                    setNickname.mutate({
                      guildId,
                      userId,
                      nickname: text || null,
                    }),
                )
              }
            >
              {t("chamada.membro.alterarApelido")}
            </ContextMenuItem>

            {can("MANAGE_ROLES") && (
              <ContextMenuSub data-gc="voz.voice-member-menu.context-menu-sub">
                <ContextMenuSubTrigger data-gc="voz.voice-member-menu.context-menu-sub-trigger">{t("chamada.membro.cargos")}</ContextMenuSubTrigger>
                <ContextMenuSubContent data-gc="voz.voice-member-menu.context-menu-sub-content">
                  {roles
                    .filter((r) => !r.isEveryone)
                    .map((role) => {
                      const has = member?.roleIds.includes(role.id) ?? false;

                      return (
                        <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--10"
                          key={role.id}
                          onSelect={(e) => {
                            e.preventDefault();
                            const roleIds = has
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
                          <Checkbox data-gc="voz.voice-member-menu.checkbox--4" readOnly checked={has} />
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

            {inCall && can("MOVE_MEMBERS") && (
              <ContextMenuSub data-gc="voz.voice-member-menu.context-menu-sub--2">
                <ContextMenuSubTrigger data-gc="voz.voice-member-menu.context-menu-sub-trigger--2">{t("chamada.membro.moverPara")}</ContextMenuSubTrigger>
                <ContextMenuSubContent data-gc="voz.voice-member-menu.context-menu-sub-content--2">
                  {voiceChannels
                    .filter((c) => c.id !== voiceState?.channelId)
                    .map((channel) => (
                      <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--12"
                        key={channel.id}
                        onSelect={() =>
                          void moveMember(userId, channel.id).catch((e: Error) =>
                            toast.error(e.message),
                          )
                        }
                      >
                        {channel.name}
                      </ContextMenuItem>
                    ))}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {inCall && (
              <>
                <ContextMenuSeparator data-gc="voz.voice-member-menu.context-menu-separator--5" />

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--13"
                  disabled={!can("MUTE_MEMBERS")}
                  danger={voiceState?.serverMute}
                  onSelect={(e) => {
                    e.preventDefault();
                    void moderateVoice({
                      userId,
                      serverMute: !voiceState?.serverMute,
                    }).catch((error: Error) => toast.error(error.message));
                  }}
                >
                  {t("chamada.membro.silenciarNoServidor")}
                  <Checkbox data-gc="voz.voice-member-menu.checkbox--5"
                    readOnly
                    checked={Boolean(voiceState?.serverMute)}
                  />
                </ContextMenuItem>

                <ContextMenuItem data-gc="voz.voice-member-menu.context-menu-item--14"
                  disabled={!can("DEAFEN_MEMBERS")}
                  danger={voiceState?.serverDeaf}
                  onSelect={(e) => {
                    e.preventDefault();
                    void moderateVoice({
                      userId,
                      serverDeaf: !voiceState?.serverDeaf,
                    }).catch((error: Error) => toast.error(error.message));
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
                  disabled={!can("MOVE_MEMBERS")}
                  onSelect={() =>
                    void kickFromVoice(userId).catch((error: Error) =>
                      toast.error(error.message),
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
