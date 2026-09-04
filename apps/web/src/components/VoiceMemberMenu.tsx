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
import { useVoiceStore } from "~/stores/voice-store";
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
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => navigate(`/channels/${guildId}`)}>
          {euMesmo ? "Ver meu perfil" : "Perfil"}
        </ContextMenuItem>

        {euMesmo && (
          <>
            <ContextMenuItem
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
                <ContextMenuSeparator />

                <ContextMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    void toggleMic();
                  }}
                >
                  {t("chamada.membro.meuMicrofone")}
                  <Checkbox readOnly checked={micEnabled} />
                </ContextMenuItem>

                <ContextMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    void toggleDeafen();
                  }}
                >
                  {t("chamada.membro.ouvirChamada")}
                  <Checkbox readOnly checked={!deafened} />
                </ContextMenuItem>

                <ContextMenuItem
                  className="text-danger"
                  onSelect={() => void sair()}
                >
                  {t("chamada.sair")}
                </ContextMenuItem>
              </>
            )}

            <ContextMenuSeparator />

            <ContextMenuItem
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
          <ContextMenuItem
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
            <ContextMenuSeparator />
            <ContextMenuLabel>
              Volume · {Math.round(volume * 100)}%
            </ContextMenuLabel>
            <div
              className="px-2.5 pb-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Slider
                min={0}
                max={1}
                step={0.05}
                value={volume}
                preenchido={volume}
                onChange={(e) => setVolumeLocal(userId, Number(e.target.value))}
              />
            </div>

            <ContextMenuItem
              onSelect={(e) => {
                e.preventDefault();
                toggleSilenciarLocal(userId);
              }}
            >
              {t("chamada.membro.silenciar")}
              <Checkbox readOnly checked={Boolean(silenciados[userId])} />
            </ContextMenuItem>
          </>
        )}

        {!euMesmo && (
          <>
            <ContextMenuSeparator />

            <ContextMenuItem
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
              <ContextMenuSub>
                <ContextMenuSubTrigger>{t("chamada.membro.cargos")}</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {roles
                    .filter((r) => !r.isEveryone)
                    .map((role) => {
                      const tem = member?.roleIds.includes(role.id) ?? false;

                      return (
                        <ContextMenuItem
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
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{
                                backgroundColor: role.color ?? "#99aab5",
                              }}
                            />
                            {role.name}
                          </span>
                          <Checkbox readOnly checked={tem} />
                        </ContextMenuItem>
                      );
                    })}

                  {roles.filter((r) => !r.isEveryone).length === 0 && (
                    <ContextMenuItem disabled>
                      {t("chamada.membro.semCargo")}
                    </ContextMenuItem>
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {naChamada && pode("MOVE_MEMBERS") && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>{t("chamada.membro.moverPara")}</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {canaisDeVoz
                    .filter((c) => c.id !== voiceState?.channelId)
                    .map((canal) => (
                      <ContextMenuItem
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
                <ContextMenuSeparator />

                <ContextMenuItem
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
                  <Checkbox
                    readOnly
                    checked={Boolean(voiceState?.serverMute)}
                  />
                </ContextMenuItem>

                <ContextMenuItem
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
                  <Checkbox
                    readOnly
                    checked={Boolean(voiceState?.serverDeaf)}
                  />
                </ContextMenuItem>

                <ContextMenuItem
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
