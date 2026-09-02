import React, { useState } from "react";
import { LogOut, ShieldAlert } from "lucide-react";

import { useAparencia } from "~/stores/aparencia";

import { useLogoutAll } from "~/@core/application/queries/auth/use-logout-all";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";

interface AccountSectionProps {
  user: SelfUserModel;
  onLogout: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({ user, onLogout }) => {
  const logoutAll = useLogoutAll();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="max-w-xl">
      <div className="rounded-lg bg-surface-1 p-5">
        <div className="flex items-center gap-4">
          <Avatar id={user.id} name={user.displayName} url={user.avatarUrl} size={64} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user.displayName}</p>
            <p className="truncate text-sm text-ink-muted">@{user.username}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Campo rotulo="E-mail" valor={user.email} sigiloso />
          <Campo
            rotulo="Entrar com"
            valor={user.providers.includes("google") ? "Conta Google" : "Login de desenvolvimento"}
          />
          <Campo
            rotulo="Membro desde"
            valor={new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
              new Date(user.createdAt),
            )}
          />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button variant="surface" onClick={onLogout} className="w-full justify-start">
          <LogOut size={16} /> Sair desta conta
        </Button>

        {confirmando ? (
          <div className="rounded border border-danger/40 bg-danger/10 p-4">
            <p className="text-sm">
              Isto derruba a sessão em <strong>todos</strong> os aparelhos, inclusive este. Serve
              para quando você esqueceu a conta aberta em outro computador.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="danger"
                size="sm"
                disabled={logoutAll.isPending}
                onClick={() => void logoutAll.mutateAsync().finally(onLogout)}
              >
                Encerrar em todos
              </Button>
              <Button variant="surface" size="sm" onClick={() => setConfirmando(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            onClick={() => setConfirmando(true)}
            className="w-full justify-start text-danger"
          >
            <ShieldAlert size={16} /> Encerrar sessão em todos os aparelhos
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Um dado da conta — e, quando marcado como sigiloso, um que some na
 * transmissão.
 *
 * Escondido não é apagado: um clique revela. Quem está no modo streamer
 * também precisa ler o próprio e-mail de vez em quando; o que ele não pode é
 * que ele apareça sem ninguém ter pedido.
 */
const Campo: React.FC<{ rotulo: string; valor: string; sigiloso?: boolean }> = ({
  rotulo,
  valor,
  sigiloso = false,
}) => {
  const [revelado, setRevelado] = useState(false);
  const prefs = useAparencia();
  const escondido = sigiloso && !revelado && prefs.modoStreamer && prefs.streamerEscondeDados;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{rotulo}</p>

      {escondido ? (
        <button
          onClick={() => setRevelado(true)}
          className="mt-0.5 rounded bg-surface-3 px-2 py-0.5 text-sm text-ink-faint transition hover:text-ink"
        >
          Escondido pelo modo streamer — clique para ver
        </button>
      ) : (
        <p className="mt-0.5 text-sm">{valor}</p>
      )}
    </div>
  );
};
