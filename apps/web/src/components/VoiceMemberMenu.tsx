import React from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import type { Channel, GuildMember, Permission, Role, VoiceState } from "@gravae/shared";
import { has } from "@gravae/shared";

import { useOpenDm } from "~/@core/application/queries/friend/use-open-dm";
import { useSetMemberRoles } from "~/@core/application/queries/role/use-set-member-roles";
import { useSetNickname } from "~/@core/application/queries/moderation/use-moderation";
import { kickFromVoice, moderateVoice, moveMember } from "~/@core/lib/websocket/emit-voice";
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
  const navigate = useNavigate();
  const openDm = useOpenDm();
  const setRoles = useSetMemberRoles(guildId);
  const confirmar = useConfirmar();
  const setNickname = useSetNickname(guildId);

  const volumes = useVoiceStore((s) => s.volumesLocais);
  const setVolumeLocal = useVoiceStore((s) => s.setVolumeLocal);
  const silenciados = useVoiceStore((s) => s.silenciadosLocais);
  const toggleSilenciarLocal = useVoiceStore((s) => s.toggleSilenciarLocal);

  const euMesmo = userId === currentUserId;
  const permissoes = new Set(minhasPermissoes);
  const pode = (p: Permission) => has(permissoes as Set<Permission>, p);

  const naChamada = Boolean(voiceState);
  /// O `min` limpa o que ficou guardado da versão em que a escala ia até 2 —
  /// sem ele, o controle abriria fora da própria régua.
  const volume = Math.min(1, volumes[userId] ?? 1);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onSelect={() => navigate(`/channels/${guildId}`)}>Perfil</ContextMenuItem>

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
            <ContextMenuLabel>Volume · {Math.round(volume * 100)}%</ContextMenuLabel>
            <div className="px-2.5 pb-2 pt-1" onClick={(e) => e.stopPropagation()}>
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
              Silenciar
              <input type="checkbox" readOnly checked={Boolean(silenciados[userId])} className="size-4 accent-brand" />
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
                  titulo: `Apelido de ${displayName}`,
                  descricao: "Vale só neste servidor. Deixe em branco para voltar ao nome original.",
                  acao: "Salvar",
                  destrutivo: false,
                  campo: { rotulo: "Apelido", placeholder: displayName },
                }).then(
                  ({ confirmado, texto }) =>
                    confirmado && setNickname.mutate({ guildId, userId, nickname: texto || null }),
                )
              }
            >
              Alterar apelido
            </ContextMenuItem>

            {pode("MANAGE_ROLES") && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>Cargos</ContextMenuSubTrigger>
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
                              ? (member?.roleIds ?? []).filter((id) => id !== role.id)
                              : [...(member?.roleIds ?? []), role.id];

                            setRoles.mutate({ guildId, userId, roleIds });
                          }}
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: role.color ?? "#99aab5" }}
                            />
                            {role.name}
                          </span>
                          <input type="checkbox" readOnly checked={tem} className="size-4 accent-brand" />
                        </ContextMenuItem>
                      );
                    })}

                  {roles.filter((r) => !r.isEveryone).length === 0 && (
                    <ContextMenuItem disabled>Nenhum cargo criado</ContextMenuItem>
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
            )}

            {naChamada && pode("MOVE_MEMBERS") && (
              <ContextMenuSub>
                <ContextMenuSubTrigger>Mover para</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  {canaisDeVoz
                    .filter((c) => c.id !== voiceState?.channelId)
                    .map((canal) => (
                      <ContextMenuItem
                        key={canal.id}
                        onSelect={() =>
                          void moveMember(userId, canal.id).catch((e: Error) => toast.error(e.message))
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
                    void moderateVoice({ userId, serverMute: !voiceState?.serverMute }).catch(
                      (erro: Error) => toast.error(erro.message),
                    );
                  }}
                >
                  Silenciar voz no servidor
                  <input
                    type="checkbox"
                    readOnly
                    checked={Boolean(voiceState?.serverMute)}
                    className="size-4 accent-danger"
                  />
                </ContextMenuItem>

                <ContextMenuItem
                  disabled={!pode("DEAFEN_MEMBERS")}
                  danger={voiceState?.serverDeaf}
                  onSelect={(e) => {
                    e.preventDefault();
                    void moderateVoice({ userId, serverDeaf: !voiceState?.serverDeaf }).catch(
                      (erro: Error) => toast.error(erro.message),
                    );
                  }}
                >
                  Desativar áudio no servidor
                  <input
                    type="checkbox"
                    readOnly
                    checked={Boolean(voiceState?.serverDeaf)}
                    className="size-4 accent-danger"
                  />
                </ContextMenuItem>

                <ContextMenuItem
                  danger
                  disabled={!pode("MOVE_MEMBERS")}
                  onSelect={() =>
                    void kickFromVoice(userId).catch((erro: Error) => toast.error(erro.message))
                  }
                >
                  Desconectar
                </ContextMenuItem>
              </>
            )}
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
