import React, { useState } from "react";
import { Check, LogOut, Monitor, ShieldAlert } from "lucide-react";

import { useAparencia } from "~/features/configuracoes/stores/aparencia";

import { useLogoutAll } from "~/@core/application/queries/auth/use-logout-all";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import {
  useEncerrarSessao,
  useSessoes,
} from "~/@core/application/queries/sessao/use-sessoes";
import {
  useAplicativosAutorizados,
  useRevogarAplicativo,
} from "~/@core/application/queries/aplicativo/use-aplicativos-autorizados";
import { useConfirmar } from "~/components/ui/confirm";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useUnblockUser } from "~/@core/application/queries/friend/use-block-user";
import { nomeDoAparelho } from "~/lib/aparelho";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";

interface AccountSectionProps {
  user: SelfUserModel;
  onLogout: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  user,
  onLogout,
}) => {
  const logoutAll = useLogoutAll();
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div data-gc="configuracoes.account-section.div">
      <Secao data-gc="configuracoes.account-section.secao" id="detalhes-de-login" titulo="Detalhes de login">
        <div data-gc="configuracoes.account-section.div--2" className="rounded-lg bg-surface-2 p-5">
          <div data-gc="configuracoes.account-section.div--3" className="flex items-center gap-4">
            <Avatar data-gc="configuracoes.account-section.avatar"
              id={user.id}
              name={user.displayName}
              url={user.avatarUrl}
              size={64}
            />
            <div data-gc="configuracoes.account-section.div--4" className="min-w-0">
              <p data-gc="configuracoes.account-section.p" className="truncate text-lg font-semibold">
                {user.displayName}
              </p>
              <p data-gc="configuracoes.account-section.p--2" className="truncate text-sm text-ink-muted">
                @{user.username}
              </p>
            </div>
          </div>

          <div data-gc="configuracoes.account-section.div--5" className="mt-5 space-y-4">
            <Campo data-gc="configuracoes.account-section.campo" rotulo="E-mail" valor={user.email} sigiloso />
            <Campo data-gc="configuracoes.account-section.campo--2"
              rotulo="Entrar com"
              valor={
                user.providers.includes("google")
                  ? "Conta Google"
                  : "Login de desenvolvimento"
              }
            />
            <Campo data-gc="configuracoes.account-section.campo--3"
              rotulo="Membro desde"
              valor={new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
              }).format(new Date(user.createdAt))}
            />
          </div>
        </div>
      </Secao>

      <Secao data-gc="configuracoes.account-section.secao--2"
        id="dispositivos"
        titulo="Dispositivos"
        detalhe="Onde a sua conta está aberta agora. Não reconheceu algum? Desconecte."
      >
        <ListaDeDispositivos data-gc="configuracoes.account-section.lista-de-dispositivos" />
      </Secao>

      <Secao data-gc="configuracoes.account-section.secao--3"
        id="usuarios-bloqueados"
        titulo="Usuários bloqueados"
        detalhe="Quem você bloqueou não te manda mensagem nem pedido de amizade. Desbloquear não refaz a amizade — só tira o bloqueio."
      >
        <ListaDeBloqueados data-gc="configuracoes.account-section.lista-de-bloqueados" />
      </Secao>

      <Secao data-gc="configuracoes.account-section.secao--4"
        id="aplicativos-autorizados"
        titulo="Aplicativos autorizados"
        detalhe="Programas de fora que você deixou entrar na sua conta. Revogar corta o acesso na hora."
      >
        <ListaDeAplicativos data-gc="configuracoes.account-section.lista-de-aplicativos" />
      </Secao>

      <Secao data-gc="configuracoes.account-section.secao--5" id="sessoes" titulo="Sessões">
        <div data-gc="configuracoes.account-section.div--6" className="space-y-3">
          <Button data-gc="configuracoes.account-section.button.on-logout"
            variant="surface"
            onClick={onLogout}
            className="w-full justify-start"
          >
            <LogOut data-gc="configuracoes.account-section.log-out" size={16} /> Sair desta conta
          </Button>

          {confirmando ? (
            <div data-gc="configuracoes.account-section.div--7" className="rounded border border-danger/40 bg-danger/10 p-4">
              <p data-gc="configuracoes.account-section.p--3" className="text-sm">
                Isto derruba a sessão em <strong data-gc="configuracoes.account-section.strong">todos</strong> os aparelhos,
                inclusive este. Serve para quando você esqueceu a conta aberta
                em outro computador.
              </p>
              <div data-gc="configuracoes.account-section.div--8" className="mt-3 flex gap-2">
                <Button data-gc="configuracoes.account-section.button"
                  variant="danger"
                  size="sm"
                  disabled={logoutAll.isPending}
                  onClick={() => void logoutAll.mutateAsync().finally(onLogout)}
                >
                  Encerrar em todos
                </Button>
                <Button data-gc="configuracoes.account-section.button--2"
                  variant="surface"
                  size="sm"
                  onClick={() => setConfirmando(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button data-gc="configuracoes.account-section.button--3"
              variant="ghost"
              onClick={() => setConfirmando(true)}
              className="w-full justify-start text-danger"
            >
              <ShieldAlert data-gc="configuracoes.account-section.shield-alert" size={16} /> Encerrar sessão em todos os aparelhos
            </Button>
          )}
        </div>
      </Secao>
    </div>
  );
};

const Campo: React.FC<{
  rotulo: string;
  valor: string;
  sigiloso?: boolean;
}> = ({ rotulo, valor, sigiloso = false }) => {
  const [revelado, setRevelado] = useState(false);
  const prefs = useAparencia();
  const escondido =
    sigiloso && !revelado && prefs.modoStreamer && prefs.streamerEscondeDados;

  return (
    <div data-gc="configuracoes.account-section.div--9">
      <p data-gc="configuracoes.account-section.p--4" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {rotulo}
      </p>

      {escondido ? (
        <button data-gc="configuracoes.account-section.button--4"
          onClick={() => setRevelado(true)}
          className="mt-0.5 rounded bg-surface-3 px-2 py-0.5 text-sm text-ink-faint transition hover:text-ink"
        >
          Escondido pelo modo streamer — clique para ver
        </button>
      ) : (
        <p data-gc="configuracoes.account-section.p--5" className="mt-0.5 text-sm">{valor}</p>
      )}
    </div>
  );
};

const ListaDeDispositivos: React.FC = () => {
  const { data: sessoes = [], isLoading } = useSessoes();
  const encerrar = useEncerrarSessao();

  if (isLoading) return <p data-gc="configuracoes.account-section.p--6" className="text-sm text-ink-faint">Carregando…</p>;

  if (!sessoes.length) {
    return (
      <p data-gc="configuracoes.account-section.p--7" className="text-sm text-ink-faint">Nenhuma outra sessão aberta.</p>
    );
  }

  return (
    <div data-gc="configuracoes.account-section.div--10" className="overflow-hidden rounded-lg border border-line">
      {sessoes.map((sessao) => (
        <div data-gc="configuracoes.account-section.div--11"
          key={sessao.id}
          className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
        >
          <Monitor data-gc="configuracoes.account-section.monitor" size={18} className="shrink-0 text-ink-faint" />

          <div data-gc="configuracoes.account-section.div--12" className="min-w-0 flex-1">
            <p data-gc="configuracoes.account-section.p--8" className="flex items-center gap-2 text-sm font-medium">
              <span data-gc="configuracoes.account-section.span" className="truncate">
                {nomeDoAparelho(sessao.userAgent)}
              </span>
              {sessao.atual && (
                <span data-gc="configuracoes.account-section.span--2" className="shrink-0 rounded-full bg-online/15 px-1.5 py-px text-10 font-semibold uppercase tracking-wide text-online">
                  este aparelho
                </span>
              )}
            </p>
            <p data-gc="configuracoes.account-section.p--9" className="mt-0.5 truncate text-xs text-ink-faint">
              {sessao.ip ?? "IP desconhecido"} · desde{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(sessao.criadaEm))}
            </p>
          </div>

          {!sessao.atual && (
            <Button data-gc="configuracoes.account-section.button--5"
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

const ESCOPOS: Record<string, string> = {
  identify: "Ver seu nome, apelido e foto",
  guilds: "Ver seus servidores e o que você pode fazer em cada um",
};

const quando = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));

const ListaDeAplicativos: React.FC = () => {
  const { data: apps = [], isLoading } = useAplicativosAutorizados();
  const revogar = useRevogarAplicativo();
  const confirmar = useConfirmar();

  if (isLoading) return <p data-gc="configuracoes.account-section.p--10" className="text-sm text-ink-faint">Carregando…</p>;

  if (!apps.length) {
    return (
      <p data-gc="configuracoes.account-section.p--11" className="text-sm text-ink-faint">
        Nenhum aplicativo tem acesso à sua conta.
      </p>
    );
  }

  return (
    <div data-gc="configuracoes.account-section.div--13" className="space-y-2">
      {apps.map((app) => (
        <div data-gc="configuracoes.account-section.div--14" key={app.id} className="rounded-lg border border-line p-3">
          <div data-gc="configuracoes.account-section.div--15" className="flex items-center gap-3">
            <Avatar data-gc="configuracoes.account-section.avatar--2"
              id={app.usuario.id}
              name={app.usuario.displayName}
              url={app.usuario.avatarUrl}
              size={36}
            />

            <div data-gc="configuracoes.account-section.div--16" className="min-w-0 flex-1">
              <p data-gc="configuracoes.account-section.p--12" className="truncate text-sm font-medium">
                {app.usuario.displayName}
              </p>
              <p data-gc="configuracoes.account-section.p--13" className="mt-0.5 truncate text-xs text-ink-faint">
                {app.autorizadoEm
                  ? `Autorizado em ${quando(app.autorizadoEm)}`
                  : "Autorizado antes desta lista existir"}
                {app.expiraEm && ` · o acesso vence em ${quando(app.expiraEm)}`}
              </p>
            </div>

            <Button data-gc="configuracoes.account-section.button--6"
              variant="ghost"
              size="sm"
              disabled={revogar.isPending}
              onClick={() =>
                void confirmar({
                  titulo: `Revogar o acesso de ${app.usuario.displayName}?`,
                  descricao:
                    "O aplicativo perde o acesso à sua conta agora, em todos os lugares onde você o autorizou. Ele pode pedir de novo, e você decide de novo.",
                  acao: "Revogar",
                  destrutivo: true,
                }).then(
                  ({ confirmado }) => confirmado && revogar.mutate(app.id),
                )
              }
              className="shrink-0 text-danger"
            >
              Revogar
            </Button>
          </div>

          <ul data-gc="configuracoes.account-section.ul" className="mt-2.5 space-y-1 border-t border-divisor pt-2.5">
            {app.escopos.map((escopo) => (
              <li data-gc="configuracoes.account-section.li"
                key={escopo}
                className="flex items-start gap-2 text-xs text-ink-muted"
              >
                <Check data-gc="configuracoes.account-section.check" size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                {ESCOPOS[escopo] ?? escopo}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const ListaDeBloqueados: React.FC = () => {
  const { data: relacoes = [], isLoading } = useFindFriends(true);
  const desbloquear = useUnblockUser();

  const bloqueados = relacoes.filter((relacao) => relacao.status === "BLOCKED");

  if (isLoading) return <p data-gc="configuracoes.account-section.p--14" className="text-sm text-ink-faint">Carregando…</p>;

  if (!bloqueados.length) {
    return <p data-gc="configuracoes.account-section.p--15" className="text-sm text-ink-faint">Você não bloqueou ninguém.</p>;
  }

  return (
    <div data-gc="configuracoes.account-section.div--17" className="overflow-hidden rounded-lg border border-line">
      {bloqueados.map((relacao) => (
        <div data-gc="configuracoes.account-section.div--18"
          key={relacao.id}
          className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
        >
          <Avatar data-gc="configuracoes.account-section.avatar--3"
            id={relacao.user.id}
            name={relacao.user.displayName}
            url={relacao.user.avatarUrl}
            size={32}
          />

          <div data-gc="configuracoes.account-section.div--19" className="min-w-0 flex-1">
            <p data-gc="configuracoes.account-section.p--16" className="truncate text-sm font-medium">
              {relacao.user.displayName}
            </p>
            <p data-gc="configuracoes.account-section.p--17" className="truncate text-xs text-ink-faint">
              @{relacao.user.username}
            </p>
          </div>

          <Button data-gc="configuracoes.account-section.button--7"
            variant="ghost"
            size="sm"
            disabled={desbloquear.isPending}
            onClick={() => desbloquear.mutate(relacao.user.id)}
            className="shrink-0"
          >
            Desbloquear
          </Button>
        </div>
      ))}
    </div>
  );
};
