import React, { useState } from "react";
import { Headphones, HeadphoneOff, Mic, MicOff, Settings, Volume2 } from "lucide-react";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { UserName } from "~/components/UserName";
import { MenuDoProprioCartao, ROTULO_DO_ESTADO } from "~/components/profile/MenuDoProprioCartao";
import { ProfileCardVisual } from "~/components/profile/ProfileCardVisual";
import { ProfileEditorModal } from "~/components/profile/ProfileEditorModal";
import { StatusModal } from "~/components/profile/StatusModal";
import { UserSettingsModal } from "~/components/user-settings/UserSettingsModal";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useVoiceStore } from "~/stores/voice-store";

interface UserPanelProps {
  user: SelfUserModel;
  guildId?: string;
  onLogout: () => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ user, guildId, onLogout }) => {
  const [configurando, setConfigurando] = useState(false);
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [definindoStatus, setDefinindoStatus] = useState(false);

  const { micEnabled, micBlocked, deafened, toggleMic, toggleDeafen } = useVoiceStore();
  const emChamada = useVoiceStore((v) => Boolean(v.channelId));
  const updateProfile = useUpdateProfile();

  /*
    Os seus cargos no servidor em que você está. Sai da mesma query que o resto
    da tela já usa, então não custa requisição nenhuma — e o cartão de quem
    clica em si mesmo passa a mostrar o que o cartão dos outros sempre mostrou.
  */
  const { data: detalhe } = useFindGuild(guildId);
  const meusIds = detalhe?.members.find((m) => m.user.id === user.id)?.roleIds ?? [];
  const meusCargos = (detalhe?.roles ?? []).filter(
    (r) => !r.isEveryone && meusIds.includes(r.id),
  );

  return (
    <>
      <div className="flex items-center gap-1 px-1 py-1">
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
              {/*
                O grupo é o texto, não o botão inteiro: passar o mouse pelo
                avatar ou pela sobra à direita não tem por que trocar a linha
                de baixo. E as duas versões dela ficam empilhadas na mesma
                célula da grade e rolam dentro de uma janelinha da altura da
                linha: uma sai por cima enquanto a outra sobe no lugar.
              */}
              <div className="group/eu min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">
                  <UserName nome={user.displayName} perfil={user.perfil} />
                </p>

                <span className="grid grid-cols-1 overflow-hidden text-xs text-ink-faint">
                  <span className="col-start-1 row-start-1 truncate transition duration-200 ease-out group-hover/eu:-translate-y-full group-hover/eu:opacity-0">
                    {emChamada ? (
                      <span className="flex items-center gap-1 text-online">
                        <Volume2 size={12} className="shrink-0" /> Em voz
                      </span>
                    ) : (
                      (user.statusPersonalizado?.texto ?? ROTULO_DO_ESTADO[user.desiredStatus])
                    )}
                  </span>

                  <span className="col-start-1 row-start-1 translate-y-full truncate opacity-0 transition duration-200 ease-out group-hover/eu:translate-y-0 group-hover/eu:opacity-100">
                    {user.username}
                  </span>
                </span>
              </div>
            </button>
          </PopoverTrigger>

          <PopoverContent side="top" className="max-h-[80vh] w-auto overflow-y-auto p-0">
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
              className="w-80 rounded-none"
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

      {configurando && (
        <UserSettingsModal
          open
          user={user}
          onClose={() => setConfigurando(false)}
          onLogout={onLogout}
          onEditarPerfil={() => {
            setConfigurando(false);
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
