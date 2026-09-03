import React, { useState } from "react";
import { Check, LogOut, Monitor, ShieldAlert } from "lucide-react";

import { useAparencia } from "~/stores/aparencia";

import { useLogoutAll } from "~/@core/application/queries/auth/use-logout-all";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/components/Avatar";
import { Button } from "~/components/ui/button";
import { useEncerrarSessao, useSessoes } from "~/@core/application/queries/sessao/use-sessoes";
import {
  useAplicativosAutorizados,
  useRevogarAplicativo,
} from "~/@core/application/queries/aplicativo/use-aplicativos-autorizados";
import { useConfirmar } from "~/components/ui/confirm";
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

      <Secao
        id="aplicativos-autorizados"
        titulo="Aplicativos autorizados"
        detalhe="Programas de fora que você deixou entrar na sua conta. Revogar corta o acesso na hora."
      >
        <ListaDeAplicativos />
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
                <span className="shrink-0 rounded-full bg-online/15 px-1.5 py-px text-10 font-semibold uppercase tracking-wide text-online">
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

/*
  Como cada escopo soa pra quem não escreveu a aplicação.

  O nome técnico não diz o que está em jogo: "guilds" não avisa ninguém de que
  o programa vê a lista inteira dos servidores dela. Escopo desconhecido cai no
  próprio nome — é melhor mostrar "identify" cru do que esconder um acesso que
  esta tela ainda não sabe traduzir.
*/
const ESCOPOS: Record<string, string> = {
  identify: "Ver seu nome, apelido e foto",
  guilds: "Ver seus servidores e o que você pode fazer em cada um",
};

const quando = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );

/**
 * As aplicações de terceiros com acesso à conta.
 *
 * A lista sai do índice por pessoa no Redis, que passou a existir junto com
 * esta tela: antes o token era só uma chave, e chave não se pergunta pelo
 * conteúdo — não havia como responder "quem tem acesso à minha conta" sem
 * varrer o banco inteiro.
 *
 * Por isso ela começa vazia para todo mundo: autorização dada antes do índice
 * continua valendo e não aparece aqui. Como o token dura sete dias, a lista
 * fica completa sozinha em uma semana.
 */
const ListaDeAplicativos: React.FC = () => {
  const { data: apps = [], isLoading } = useAplicativosAutorizados();
  const revogar = useRevogarAplicativo();
  const confirmar = useConfirmar();

  if (isLoading) return <p className="text-sm text-ink-faint">Carregando…</p>;

  if (!apps.length) {
    return (
      <p className="text-sm text-ink-faint">
        Nenhum aplicativo tem acesso à sua conta.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {apps.map((app) => (
        <div key={app.id} className="rounded-lg border border-line p-3">
          <div className="flex items-center gap-3">
            <Avatar
              id={app.usuario.id}
              name={app.usuario.displayName}
              url={app.usuario.avatarUrl}
              size={36}
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{app.usuario.displayName}</p>
              <p className="mt-0.5 truncate text-xs text-ink-faint">
                {app.autorizadoEm
                  ? `Autorizado em ${quando(app.autorizadoEm)}`
                  : "Autorizado antes desta lista existir"}
                {app.expiraEm && ` · o acesso vence em ${quando(app.expiraEm)}`}
              </p>
            </div>

            <Button
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
                }).then(({ confirmado }) => confirmado && revogar.mutate(app.id))
              }
              className="shrink-0 text-danger"
            >
              Revogar
            </Button>
          </div>

          {/*
            Os escopos ficam à mostra, e não atrás de um "ver detalhes": eles
            são a única coisa que separa um app que lê o seu nome de um que lê
            a lista inteira dos seus servidores. É o que a pessoa precisa pra
            decidir se revoga.
          */}
          <ul className="mt-2.5 space-y-1 border-t border-divisor pt-2.5">
            {app.escopos.map((escopo) => (
              <li key={escopo} className="flex items-start gap-2 text-xs text-ink-muted">
                <Check size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                {ESCOPOS[escopo] ?? escopo}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
