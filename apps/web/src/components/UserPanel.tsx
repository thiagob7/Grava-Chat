import React, { useState } from "react";
import { Headphones, HeadphoneOff, Mic, MicOff, Settings, Volume2 } from "lucide-react";

import { useUpdateProfile } from "~/@core/application/queries/auth/use-update-profile";
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
  onLogout: () => void;
}

/**
 * O bloco do seu usuário, embaixo da lista de canais. Clicar no nome abre o
 * cartão de perfil; a engrenagem abre as configurações — que é o que ela deveria
 * ter feito desde o começo (antes ela era um botão de sair disfarçado).
 */
export const UserPanel: React.FC<UserPanelProps> = ({ user, onLogout }) => {
  // qual seção abrir: o botão de perfil vai pro perfil, a engrenagem pra conta
  const [configurando, setConfigurando] = useState(false);
  /**
   * O editor de perfil é um modal SEPARADO das configurações. Os dois abrem
   * daqui, e o de perfil também de dentro do outro — é a mesma sala com duas
   * portas, não duas telas parecidas.
   */
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  /** o status se muda daqui mesmo: é recado de momento, não visita ao editor */
  const [definindoStatus, setDefinindoStatus] = useState(false);

  /**
   * Microfone e fone moram aqui, e não no painel da chamada.
   *
   * São preferências SUAS, não da call: entrar mutado é uma decisão que a
   * pessoa toma antes de entrar. No painel de voz eles só existiam durante a
   * chamada, o que fazia parecer que mutar dependia de estar em uma.
   */
  const { micEnabled, micBlocked, deafened, toggleMic, toggleDeafen } = useVoiceStore();
  const emChamada = useVoiceStore((v) => Boolean(v.channelId));
  const updateProfile = useUpdateProfile();

  return (
    <>
      <div className="flex items-center gap-1 bg-surface-0 px-2 py-2">
        <Popover>
          <PopoverTrigger asChild>
            {/*
              O recorte da bolinha de status tem que ser do tom DESTA barra, que
              é `surface-0` — sem isto ela vem com o aro de `surface-1` em volta,
              que é o bug que dá pra ver hoje na barra de baixo.
            */}
            <button className="group/eu flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 text-left transition hover:bg-surface-3 [--gc-recorte:var(--color-surface-0)]">
              <Avatar
                id={user.id}
                name={user.displayName}
                url={user.avatarUrl}
                size={32}
                status={user.status}
                enfeites={user.perfil}
              />
              <div className="min-w-0 flex-1">
                {/*
                  Sem cor de cargo aqui: esta barra é a mesma em todos os
                  servidores, e um cargo é de UM servidor. Pintar o próprio nome
                  com a cor de um deles seria mentir nos outros.
                */}
                <p className="truncate text-sm font-medium leading-tight">
                  <UserName nome={user.displayName} perfil={user.perfil} />
                </p>
                {/*
                  Duas linhas ocupando o MESMO lugar: a de baixo aparece com o
                  mouse em cima.
                  
                  O `@usuario` é o que se copia pra mandar pra alguém, e é
                  justamente o que ninguém precisa ler o tempo todo. Deixá-lo só
                  no hover libera a linha para o que muda — "Em voz", o status
                  personalizado — sem precisar de uma terceira linha.
                */}
                <p className="truncate text-xs text-ink-faint group-hover/eu:hidden">
                  {emChamada ? (
                    <span className="flex items-center gap-1 text-online">
                      <Volume2 size={12} className="shrink-0" /> Em voz
                    </span>
                  ) : (
                    /*
                      O que EU escolhi, não a projeção pública: quem está
                      invisível precisa ler "Invisível" aqui, senão o próprio
                      app diz que você está offline e parece que a escolha não
                      pegou.
                    */
                    (user.statusPersonalizado?.texto ?? ROTULO_DO_ESTADO[user.desiredStatus])
                  )}
                </p>
                <p className="hidden truncate text-xs text-ink-faint group-hover/eu:block">
                  {user.username}
                </p>
              </div>
            </button>
          </PopoverTrigger>

          <PopoverContent side="top" className="max-h-[80vh] w-80 overflow-y-auto p-0">
            {/*
              O MESMO cartão que os outros veem ao clicar em você.
              
              Aqui era uma cópia escrita à mão: faixa vermelha chapada, sem
              banner, sem etiqueta, sem status. Ela nasceu antes do componente e
              foi ficando pra trás a cada coisa nova — que é o destino de toda
              segunda cópia de um layout.
            */}
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
