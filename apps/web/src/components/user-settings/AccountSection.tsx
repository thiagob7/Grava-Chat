import React, { useState } from "react";
import { LogOut, Monitor, ShieldAlert } from "lucide-react";

import { useAparencia } from "~/stores/aparencia";

import { useLogoutAll } from "~/@core/application/queries/auth/use-logout-all";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { useEncerrarSessao, useSessoes } from "~/@core/application/queries/sessao/use-sessoes";
import { nomeDoAparelho } from "~/lib/aparelho";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";

interface AccountSectionProps {
  user: SelfUserModel;
  onLogout: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({ user, onLogout }) => {
  const logoutAll = useLogoutAll();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div>
      <Secao id="detalhes-de-login" titulo="Detalhes de login">
        {/*
          `surface-2`, e não `surface-1`: o painel das configurações passou a
          ser `surface-1`, e um cartão da mesma cor do fundo é um cartão que
          não existe.
        */}
        <div className="rounded-lg bg-surface-2 p-5">
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
      </Secao>

      <Secao
        id="dispositivos"
        titulo="Dispositivos"
        detalhe="Onde a sua conta está aberta agora. Não reconheceu algum? Desconecte."
      >
        <ListaDeDispositivos />
      </Secao>

      <Secao id="sessoes" titulo="Sessões">
        <div className="space-y-3">
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
      </Secao>
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

/*
  Os aparelhos em que a conta está aberta.

  A lista existe por um motivo de segurança e não de curiosidade: é o único
  lugar onde alguém descobre que a conta está aberta num computador que não é
  dela. Por isso o IP fica visível ao lado do nome — quando o palpite do
  `user-agent` erra, é o IP que denuncia o que não devia estar ali.

  O aparelho ATUAL não tem botão. Encerrá-lo por aqui deixaria o app com um
  cookie morto na mão, sem saber que perdeu a sessão; sair daqui é o botão de
  sair, logo abaixo, que limpa o cookie junto.
*/
const ListaDeDispositivos: React.FC = () => {
  const { data: sessoes = [], isLoading } = useSessoes();
  const encerrar = useEncerrarSessao();

  if (isLoading) return <p className="text-sm text-ink-faint">Carregando…</p>;

  if (!sessoes.length) {
    return <p className="text-sm text-ink-faint">Nenhuma outra sessão aberta.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      {sessoes.map((sessao) => (
        <div
          key={sessao.id}
          className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
        >
          <Monitor size={18} className="shrink-0 text-ink-faint" />

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              <span className="truncate">{nomeDoAparelho(sessao.userAgent)}</span>
              {sessao.atual && (
                <span className="shrink-0 rounded-full bg-online/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-online">
                  este aparelho
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-faint">
              {sessao.ip ?? "IP desconhecido"} · desde{" "}
              {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
                new Date(sessao.criadaEm),
              )}
            </p>
          </div>

          {!sessao.atual && (
            <Button
              variant="ghost"
              size="sm"
              disabled={encerrar.isPending}
              onClick={() => encerrar.mutate(sessao.id)}
              className="shrink-0 text-danger"
            >
              Desconectar
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
