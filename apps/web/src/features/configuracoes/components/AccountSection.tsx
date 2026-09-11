import React, { useState } from "react";
import { Check, LogOut, Monitor, ShieldAlert } from "lucide-react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";

import { useLogoutAll } from "~/@core/application/queries/auth/use-logout-all";
import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { Avatar } from "~/features/perfil/components/Avatar";
import { Button } from "~/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input, Label } from "~/components/ui/input";
import {
  useEmailRequestVerification,
  useSwapPassword,
} from "~/@core/application/queries/auth/use-senha";
import { apiErrorMessage } from "~/@core/lib/api";
import { toast } from "react-toastify";
import { useTranslation } from "~/traducao";
import {
  useEndSession,
  useSessions,
} from "~/@core/application/queries/sessao/use-sessoes";
import {
  useAppsAuthorized,
  useRevokeApp,
} from "~/@core/application/queries/aplicativo/use-aplicativos-autorizados";
import { useConfirm } from "~/components/ui/confirm";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useUnblockUser } from "~/@core/application/queries/friend/use-block-user";
import { deviceName } from "~/lib/aparelho";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";

interface AccountSectionProps {
  user: SelfUserModel;
  onLogout: () => void;
}

export const AccountSection: React.FC<AccountSectionProps> = ({
  user,
  onLogout,
}) => {
  const { t } = useTranslation();
  const logoutAll = useLogoutAll();
  const requestVerification = useEmailRequestVerification();
  const [sent, setSent] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [swappingPassword, setSwappingPassword] = useState(false);

  return (
    <div data-gc="configuracoes.account-section.div">
      <Section data-gc="configuracoes.account-section.section" id="detalhes-de-login" title="Detalhes de login">
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
            <Field data-gc="configuracoes.account-section.field" label="E-mail" value={user.email} secret />

            {!user.verifiedEmail && (
              <div data-gc="configuracoes.account-section.div--6" className="rounded-lg border border-line bg-surface-1 p-4">
                <p data-gc="configuracoes.account-section.p--3" className="text-sm font-medium">
                  {t("configuracoes.email.verificarTitulo")}
                </p>
                <p data-gc="configuracoes.account-section.p--4" className="mt-0.5 text-xs text-ink-faint">
                  {sent
                    ? t("configuracoes.email.enviado")
                    : t("configuracoes.email.verificarDetalhe")}
                </p>

                {!sent && (
                  <Button data-gc="configuracoes.account-section.button"
                    variant="surface"
                    size="sm"
                    className="mt-3"
                    disabled={requestVerification.isPending}
                    onClick={() =>
                      void requestVerification
                        .mutateAsync()
                        .then(() => setSent(true))
                        .catch((e) =>
                          toast.error(apiErrorMessage(e, t("configuracoes.email.falhou"))),
                        )
                    }
                  >
                    {t("configuracoes.email.enviar")}
                  </Button>
                )}
              </div>
            )}
            <Field data-gc="configuracoes.account-section.field--2"
              label="Entrar com"
              value={
                [
                  user.providers.includes("google") && "Conta Google",
                  user.providers.includes("senha") && "E-mail e senha",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Login de desenvolvimento"
              }
            />
            <Field data-gc="configuracoes.account-section.field--3"
              label="Membro desde"
              value={new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
              }).format(new Date(user.createdAt))}
            />
          </div>
        </div>
      </Section>

      <Section data-gc="configuracoes.account-section.section--2" id="senha" title="Senha">
        <div data-gc="configuracoes.account-section.div--7" className="flex items-center justify-between gap-4 rounded-lg bg-surface-2 p-5">
          <div data-gc="configuracoes.account-section.div--8" className="min-w-0">
            <p data-gc="configuracoes.account-section.p--5" className="text-sm font-medium">{user.providers.includes("senha") ? "Alterar a senha" : "Criar uma senha"}</p>
            <p data-gc="configuracoes.account-section.p--6" className="mt-0.5 text-xs text-ink-faint">
              {user.providers.includes("senha")
                ? "Você entra com e-mail e senha. Troque quando quiser."
                : "Com uma senha, você entra por e-mail também, sem depender do Google."}
            </p>
          </div>
          <Button data-gc="configuracoes.account-section.button--2" variant="surface" size="sm" onClick={() => setSwappingPassword(true)}>
            {user.providers.includes("senha") ? "Alterar" : "Criar"}
          </Button>
        </div>
      </Section>

      <SwapPassword data-gc="configuracoes.account-section.swap-password"
        isOpen={swappingPassword}
        hasPassword={user.providers.includes("senha")}
        onClose={() => setSwappingPassword(false)}
      />

      <Section data-gc="configuracoes.account-section.section--3"
        id="dispositivos"
        title="Dispositivos"
        detail="Onde a sua conta está aberta agora. Não reconheceu algum? Desconecte."
      >
        <ListDevices data-gc="configuracoes.account-section.list-devices" />
      </Section>

      <Section data-gc="configuracoes.account-section.section--4"
        id="usuarios-bloqueados"
        title="Usuários bloqueados"
        detail="Quem você bloqueou não te manda mensagem nem pedido de amizade. Desbloquear não refaz a amizade — só tira o bloqueio."
      >
        <ListBlocked data-gc="configuracoes.account-section.list-blocked" />
      </Section>

      <Section data-gc="configuracoes.account-section.section--5"
        id="aplicativos-autorizados"
        title="Aplicativos autorizados"
        detail="Programas de fora que você deixou entrar na sua conta. Revogar corta o acesso na hora."
      >
        <ListApps data-gc="configuracoes.account-section.list-apps" />
      </Section>

      <Section data-gc="configuracoes.account-section.section--6" id="sessoes" title="Sessões">
        <div data-gc="configuracoes.account-section.div--9" className="space-y-3">
          <Button data-gc="configuracoes.account-section.button.on-logout"
            variant="surface"
            onClick={onLogout}
            className="w-full justify-start"
          >
            <LogOut data-gc="configuracoes.account-section.log-out" size={16} /> Sair desta conta
          </Button>

          {confirming ? (
            <div data-gc="configuracoes.account-section.div--10" className="rounded border border-danger/40 bg-danger-fundo p-4">
              <p data-gc="configuracoes.account-section.p--7" className="text-sm">
                Isto derruba a sessão em <strong data-gc="configuracoes.account-section.strong">todos</strong> os aparelhos,
                inclusive este. Serve para quando você esqueceu a conta aberta
                em outro computador.
              </p>
              <div data-gc="configuracoes.account-section.div--11" className="mt-3 flex gap-2">
                <Button data-gc="configuracoes.account-section.button--3"
                  variant="danger"
                  size="sm"
                  disabled={logoutAll.isPending}
                  onClick={() => void logoutAll.mutateAsync().finally(onLogout)}
                >
                  Encerrar em todos
                </Button>
                <Button data-gc="configuracoes.account-section.button--4"
                  variant="surface"
                  size="sm"
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button data-gc="configuracoes.account-section.button--5"
              variant="ghost"
              onClick={() => setConfirming(true)}
              className="w-full justify-start text-danger"
            >
              <ShieldAlert data-gc="configuracoes.account-section.shield-alert" size={16} /> Encerrar sessão em todos os aparelhos
            </Button>
          )}
        </div>
      </Section>
    </div>
  );
};

const SwapPassword: React.FC<{ isOpen: boolean; hasPassword: boolean; onClose: () => void }> = ({
  isOpen,
  hasPassword,
  onClose,
}) => {
  const swap = useSwapPassword();
  const [current, setCurrent] = useState("");
  const [fresh, setNew] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (fresh.length < 8) return setError("A senha precisa de pelo menos 8 caracteres");
    if (fresh !== confirmation) return setError("As duas senhas não batem");

    setError(null);
    swap.mutate(
      { current: hasPassword ? current : undefined, fresh },
      {
        onSuccess: () => {
          setCurrent("");
          setNew("");
          setConfirmation("");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog data-gc="configuracoes.account-section.dialog" open={isOpen} onOpenChange={(a) => !a && onClose()}>
      <DialogContent data-gc="configuracoes.account-section.dialog-content" className="max-w-sm">
        <DialogHeader data-gc="configuracoes.account-section.dialog-header">
          <DialogTitle data-gc="configuracoes.account-section.dialog-title">{hasPassword ? "Alterar a senha" : "Criar uma senha"}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="configuracoes.account-section.dialog-body" className="space-y-4">
          {hasPassword && (
            <div data-gc="configuracoes.account-section.div--12">
              <Label data-gc="configuracoes.account-section.label" htmlFor="senha-atual">Senha atual</Label>
              <Input data-gc="configuracoes.account-section.input" id="senha-atual" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
            </div>
          )}
          <div data-gc="configuracoes.account-section.div--13">
            <Label data-gc="configuracoes.account-section.label--2" htmlFor="senha-nova">Nova senha</Label>
            <Input data-gc="configuracoes.account-section.input--2" id="senha-nova" type="password" autoComplete="new-password" value={fresh} onChange={(e) => setNew(e.target.value)} placeholder="Pelo menos 8 caracteres" />
          </div>
          <div data-gc="configuracoes.account-section.div--14">
            <Label data-gc="configuracoes.account-section.label--3" htmlFor="senha-confirmacao">Repita a nova senha</Label>
            <Input data-gc="configuracoes.account-section.input--3" id="senha-confirmacao" type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} error={error ?? undefined} />
          </div>
        </DialogBody>

        <DialogFooter data-gc="configuracoes.account-section.dialog-footer">
          <Button data-gc="configuracoes.account-section.button.on-close" variant="surface" onClick={onClose}>Cancelar</Button>
          <Button data-gc="configuracoes.account-section.button.save" onClick={save} disabled={swap.isPending}>{swap.isPending ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  secret?: boolean;
}> = ({ label, value, secret = false }) => {
  const [revealed, setRevealed] = useState(false);
  const prefs = useAppearance();
  const hidden =
    secret && !revealed && prefs.modeStreamer && prefs.streamerHidesData;

  return (
    <div data-gc="configuracoes.account-section.div--15">
      <p data-gc="configuracoes.account-section.p--8" className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>

      {hidden ? (
        <button data-gc="configuracoes.account-section.button--6"
          onClick={() => setRevealed(true)}
          className="mt-0.5 rounded bg-surface-3 px-2 py-0.5 text-sm text-ink-faint transition hover:text-ink"
        >
          Escondido pelo modo streamer — clique para ver
        </button>
      ) : (
        <p data-gc="configuracoes.account-section.p--9" className="mt-0.5 text-sm">{value}</p>
      )}
    </div>
  );
};

const ListDevices: React.FC = () => {
  const { data: sessions = [], isLoading } = useSessions();
  const end = useEndSession();

  if (isLoading) return <p data-gc="configuracoes.account-section.p--10" className="text-sm text-ink-faint">Carregando…</p>;

  if (!sessions.length) {
    return (
      <p data-gc="configuracoes.account-section.p--11" className="text-sm text-ink-faint">Nenhuma outra sessão aberta.</p>
    );
  }

  return (
    <div data-gc="configuracoes.account-section.div--16" className="overflow-hidden rounded-lg border border-line">
      {sessions.map((session) => (
        <div data-gc="configuracoes.account-section.div--17"
          key={session.id}
          className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
        >
          <Monitor data-gc="configuracoes.account-section.monitor" size={18} className="shrink-0 text-ink-faint" />

          <div data-gc="configuracoes.account-section.div--18" className="min-w-0 flex-1">
            <p data-gc="configuracoes.account-section.p--12" className="flex items-center gap-2 text-sm font-medium">
              <span data-gc="configuracoes.account-section.span" className="truncate">
                {deviceName(session.userAgent)}
              </span>
              {session.current && (
                <span data-gc="configuracoes.account-section.span--2" className="shrink-0 rounded-full bg-online/15 px-1.5 py-px text-10 font-semibold uppercase tracking-wide text-online">
                  este aparelho
                </span>
              )}
            </p>
            <p data-gc="configuracoes.account-section.p--13" className="mt-0.5 truncate text-xs text-ink-faint">
              {session.ip ?? "IP desconhecido"} · desde{" "}
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              }).format(new Date(session.createdAt))}
            </p>
          </div>

          {!session.current && (
            <Button data-gc="configuracoes.account-section.button--7"
              variant="ghost"
              size="sm"
              disabled={end.isPending}
              onClick={() => end.mutate(session.id)}
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

const SCOPES: Record<string, string> = {
  identify: "Ver seu nome, apelido e foto",
  guilds: "Ver seus servidores e o que você pode fazer em cada um",
};

const when = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));

const ListApps: React.FC = () => {
  const { data: apps = [], isLoading } = useAppsAuthorized();
  const revoke = useRevokeApp();
  const confirm = useConfirm();

  if (isLoading) return <p data-gc="configuracoes.account-section.p--14" className="text-sm text-ink-faint">Carregando…</p>;

  if (!apps.length) {
    return (
      <p data-gc="configuracoes.account-section.p--15" className="text-sm text-ink-faint">
        Nenhum aplicativo tem acesso à sua conta.
      </p>
    );
  }

  return (
    <div data-gc="configuracoes.account-section.div--19" className="space-y-2">
      {apps.map((app) => (
        <div data-gc="configuracoes.account-section.div--20" key={app.id} className="rounded-lg border border-line p-3">
          <div data-gc="configuracoes.account-section.div--21" className="flex items-center gap-3">
            <Avatar data-gc="configuracoes.account-section.avatar--2"
              id={app.user.id}
              name={app.user.displayName}
              url={app.user.avatarUrl}
              size={36}
            />

            <div data-gc="configuracoes.account-section.div--22" className="min-w-0 flex-1">
              <p data-gc="configuracoes.account-section.p--16" className="truncate text-sm font-medium">
                {app.user.displayName}
              </p>
              <p data-gc="configuracoes.account-section.p--17" className="mt-0.5 truncate text-xs text-ink-faint">
                {app.authorizedAt
                  ? `Autorizado em ${when(app.authorizedAt)}`
                  : "Autorizado antes desta lista existir"}
                {app.expiresAt && ` · o acesso vence em ${when(app.expiresAt)}`}
              </p>
            </div>

            <Button data-gc="configuracoes.account-section.button--8"
              variant="ghost"
              size="sm"
              disabled={revoke.isPending}
              onClick={() =>
                void confirm({
                  title: `Revogar o acesso de ${app.user.displayName}?`,
                  description:
                    "O aplicativo perde o acesso à sua conta agora, em todos os lugares onde você o autorizou. Ele pode pedir de novo, e você decide de novo.",
                  action: "Revogar",
                  destructive: true,
                }).then(
                  ({ confirmed }) => confirmed && revoke.mutate(app.id),
                )
              }
              className="shrink-0 text-danger"
            >
              Revogar
            </Button>
          </div>

          <ul data-gc="configuracoes.account-section.ul" className="mt-2.5 space-y-1 border-t border-divisor pt-2.5">
            {app.scopes.map((scope) => (
              <li data-gc="configuracoes.account-section.li"
                key={scope}
                className="flex items-start gap-2 text-xs text-ink-muted"
              >
                <Check data-gc="configuracoes.account-section.check" size={13} className="mt-0.5 shrink-0 text-ink-faint" />
                {SCOPES[scope] ?? scope}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

const ListBlocked: React.FC = () => {
  const { data: relations = [], isLoading } = useFindFriends(true);
  const unblock = useUnblockUser();

  const blocked = relations.filter((relation) => relation.status === "BLOCKED");

  if (isLoading) return <p data-gc="configuracoes.account-section.p--18" className="text-sm text-ink-faint">Carregando…</p>;

  if (!blocked.length) {
    return <p data-gc="configuracoes.account-section.p--19" className="text-sm text-ink-faint">Você não bloqueou ninguém.</p>;
  }

  return (
    <div data-gc="configuracoes.account-section.div--23" className="overflow-hidden rounded-lg border border-line">
      {blocked.map((relation) => (
        <div data-gc="configuracoes.account-section.div--24"
          key={relation.id}
          className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0"
        >
          <Avatar data-gc="configuracoes.account-section.avatar--3"
            id={relation.user.id}
            name={relation.user.displayName}
            url={relation.user.avatarUrl}
            size={32}
          />

          <div data-gc="configuracoes.account-section.div--25" className="min-w-0 flex-1">
            <p data-gc="configuracoes.account-section.p--20" className="truncate text-sm font-medium">
              {relation.user.displayName}
            </p>
            <p data-gc="configuracoes.account-section.p--21" className="truncate text-xs text-ink-faint">
              @{relation.user.username}
            </p>
          </div>

          <Button data-gc="configuracoes.account-section.button--9"
            variant="ghost"
            size="sm"
            disabled={unblock.isPending}
            onClick={() => unblock.mutate(relation.user.id)}
            className="shrink-0"
          >
            Desbloquear
          </Button>
        </div>
      ))}
    </div>
  );
};
