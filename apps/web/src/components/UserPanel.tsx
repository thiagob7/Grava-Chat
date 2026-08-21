import React, { useState } from "react";
import { Headphones, HeadphoneOff, Mic, MicOff, Settings } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { UserSettingsModal } from "~/components/user-settings/UserSettingsModal";
import { Button } from "~/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";
import { useVoiceStore } from "~/stores/voice-store";

interface UserPanelProps {
  user: SelfUserModel;
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  ONLINE: "Disponível",
  IDLE: "Ausente",
  DND: "Não perturbe",
  OFFLINE: "Offline",
};

/**
 * O bloco do seu usuário, embaixo da lista de canais. Clicar no nome abre o
 * cartão de perfil; a engrenagem abre as configurações — que é o que ela deveria
 * ter feito desde o começo (antes ela era um botão de sair disfarçado).
 */
export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  // qual seção abrir: o botão de perfil vai pro perfil, a engrenagem pra conta
  const [configurando, setConfigurando] = useState<"conta" | "perfil" | null>(null);

  /**
   * Microfone e fone moram aqui, e não no painel da chamada.
   *
   * São preferências SUAS, não da call: entrar mutado é uma decisão que a
   * pessoa toma antes de entrar. No painel de voz eles só existiam durante a
   * chamada, o que fazia parecer que mutar dependia de estar em uma.
   */
  const { micEnabled, micBlocked, deafened, toggleMic, toggleDeafen } = useVoiceStore();

  return (
    <>
      <div className="flex items-center gap-1 bg-surface-0 px-2 py-2">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left transition hover:bg-surface-3">
              <Avatar
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={32}
                status={user.status}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight">{user.displayName}</p>
                <p className="truncate text-xs text-ink-faint">
                  {STATUS_LABEL[user.status] ?? `@${user.username}`}
                </p>
              </div>
            </button>
          </PopoverTrigger>

          <PopoverContent side="top" className="w-80 p-0">
            <div className="h-16 rounded-t-lg bg-brand" />

            <div className="px-4 pb-4">
              <div className="-mt-10 mb-3">
                <Avatar
                  id={user.id}
                  name={user.displayName}
                  url={user.avatarUrl}
                  size={72}
                  className="rounded-full ring-[6px] ring-surface-0"
                />
              </div>

              <p className="text-lg font-bold leading-tight">{user.displayName}</p>
              <p className="text-sm text-ink-muted">@{user.username}</p>

              {user.bio && (
                <>
                  <div className="my-3 h-px bg-line" />
                  <p className="whitespace-pre-wrap text-sm text-ink-muted">{user.bio}</p>
                </>
              )}

              <div className="my-3 h-px bg-line" />
              <p className="text-xs font-semibold uppercase text-ink-faint">Membro desde</p>
              <p className="text-sm text-ink-muted">
                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(user.createdAt))}
              </p>

              <Button onClick={() => setConfigurando("perfil")} className="mt-4 w-full">
                Editar perfil
              </Button>
            </div>
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
            onClick={() => setConfigurando("conta")}
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
          secaoInicial={configurando}
          onClose={() => setConfigurando(null)}
          onLogout={onLogout}
        />
      )}
    </>
  );
};

interface BotaoDoPainelProps {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  /** vermelho = está cortando alguma coisa (mudo, surdo, bloqueado) */
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
