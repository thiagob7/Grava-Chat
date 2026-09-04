import React, { useState } from "react";
import { Headphones, HeadphoneOff, Mic, MicOff, Phone, Settings, Volume2 } from "lucide-react";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { UserName } from "~/features/perfil/components/UserName";
import { MenuDoProprioCartao, rotuloDoEstado } from "~/features/perfil/components/cartao/MenuDoProprioCartao";
import { ProfileCardVisual } from "~/features/perfil/components/cartao/ProfileCardVisual";
import { ProfileEditorModal } from "~/features/perfil/components/cartao/ProfileEditorModal";
import { StatusModal } from "~/features/perfil/components/cartao/StatusModal";
import { UserSettingsModal } from "~/features/configuracoes/components/UserSettingsModal";
import { useConfiguracoes } from "~/features/configuracoes/stores/configuracoes";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

interface UserPanelProps {
  user: SelfUserModel;
  guildId?: string;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, guildId, onLogout }) => {
  const [configurando, setConfigurando] = useState(false);
  const secaoPedida = useConfiguracoes((s) => s.secao);
  const fecharPedido = useConfiguracoes((s) => s.fechar);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [definindoStatus, setDefinindoStatus] = useState(false);

  const { micEnabled, micBlocked, deafened, toggleMic, toggleDeafen } = useVoiceStore();
  const emChamada = useVoiceStore((v) => Boolean(v.channelId));
  const emChamadaNoPrivado = useVoiceStore((v) => Boolean(v.channelId) && !v.guildId);
  const updateProfile = useUpdateProfile();

  const { data: detalhe } = useFindGuild(guildId);
  const meusIds = detalhe?.members.find((m) => m.user.id === user.id)?.roleIds ?? [];
  const meusCargos = (detalhe?.roles ?? []).filter(
    (r) => !r.isEveryone && meusIds.includes(r.id),
  );

  return (
    <>
      <div className="flex cursor-pointer items-center gap-1 px-1 py-1">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left transition hover:bg-surface-3">
              <Avatar
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={32}
                status={user.status}
                enfeites={user.perfil}
              />
              <div className="group/eu min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  <UserName nome={user.displayName} perfil={user.perfil} />
                </p>

                <span className="grid grid-cols-1 overflow-hidden text-xs text-ink-faint">
                  <span className="col-start-1 row-start-1 truncate transition duration-200 ease-out group-hover/eu:-translate-y-full group-hover/eu:opacity-0">
                    {emChamada ? (
                      <span className="flex items-center gap-1 text-online">
                        {emChamadaNoPrivado ? (
                          <>
                            <Phone size={12} className="shrink-0" /> Em uma chamada
                          </>
                        ) : (
                          <>
                            <Volume2 size={12} className="shrink-0" /> Em voz
                          </>
                        )}
                      </span>
                    ) : (
                      (user.statusPersonalizado?.texto ?? rotuloDoEstado(user.desiredStatus))
                    )}
                  </span>

                  <span className="col-start-1 row-start-1 translate-y-full truncate opacity-0 transition duration-200 ease-out group-hover/eu:translate-y-0 group-hover/eu:opacity-100">
                    {user.username}
                  </span>
                </span>
              </div>
            </button>
          </PopoverTrigger>

          <PopoverContent side="top" className="max-h-[80vh] w-80 overflow-y-auto p-0">
            <ProfileCardVisual
              id={user.id}
              displayName={user.displayName}
              username={user.username}
              avatarUrl={user.avatarUrl}
              status={user.status}
              perfil={user.perfil}
              statusPersonalizado={user.statusPersonalizado}
              bio={user.bio}
              createdAt={user.createdAt}
              cargos={meusCargos}
              onStatus={() => setDefinindoStatus(true)}
              className="rounded-none"
            >
              <MenuDoProprioCartao
                user={user}
                onEditarPerfil={() => setEditandoPerfil(true)}
                onGerenciarContas={() => setConfigurando(true)}
              />
            </ProfileCardVisual>
          </PopoverContent>
        </Popover>

        <BotaoDoPainel
          label={micBlocked ? "Microfone bloqueado" : micEnabled ? "Mutar" : "Desmutar"}
          onClick={() => void toggleMic()}
          cortado={!micEnabled || micBlocked}
        >
          {micEnabled && !micBlocked ? <Mic size={18} /> : <MicOff size={18} />}
        </BotaoDoPainel>

        <BotaoDoPainel
          label={deafened ? "Ouvir" : "Ficar surdo"}
          onClick={() => void toggleDeafen()}
          cortado={deafened}
        >
          {deafened ? <HeadphoneOff size={18} /> : <Headphones size={18} />}
        </BotaoDoPainel>

        <Tooltip label="Configurações">
          <button
            onClick={() => setConfigurando(true)}
            aria-label="Configurações"
            className="rounded p-1.5 text-ink-muted transition hover:bg-surface-3 hover:text-ink"
          >
            <Settings size={18} />
          </button>
        </Tooltip>
      </div>

      {(configurando || secaoPedida) && (
        <UserSettingsModal
          open
          key={secaoPedida ?? "conta"}
          secaoInicial={secaoPedida ?? "conta"}
          user={user}
          onClose={() => {
            setConfigurando(false);
            fecharPedido();
          }}
          onLogout={onLogout}
          onEditarPerfil={() => {
            setConfigurando(false);
            fecharPedido();
            setEditandoPerfil(true);
          }}
        />
      )}

      {editandoPerfil && (
        <ProfileEditorModal open user={user} onClose={() => setEditandoPerfil(false)} />
      )}

      {definindoStatus && (
        <StatusModal
          open
          user={user}
          perfil={user.perfil}
          onClose={() => setDefinindoStatus(false)}
          onSalvar={(status) =>
            void updateProfile
              .mutateAsync({ statusPersonalizado: status })
              .then(() => setDefinindoStatus(false))
              .catch(() => null)
          }
          salvando={updateProfile.isPending}
        />
      )}
    </>
  );
};

interface BotaoDoPainelProps {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  cortado?: boolean;
}

const BotaoDoPainel: React.FC<BotaoDoPainelProps> = ({ children, label, onClick, cortado }) => (
  <Tooltip label={label}>
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={cortado}
      className={cn(
        "shrink-0 rounded p-1.5 transition hover:bg-surface-3",
        cortado ? "text-danger" : "text-ink-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);
