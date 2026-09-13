import React, { useState } from "react";
import { KeyRound, LockKeyhole, ShieldAlert } from "lucide-react";
import { ADMIN_PASSWORD_MIN } from "@gravae/shared";

import { useChangePanelPassword, useUnlockPanel } from "~/@core/application/queries/admin/use-painel";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";

/*
  As duas portas antes do painel: a senha do painel, e a troca da senha
  provisória. Enquanto não passar das duas, a API não responde nenhuma área, então
  esta tela não é enfeite: é o que dá para ver.
*/
export const PanelUnlock: React.FC<{ email: string }> = ({ email }) => {
  const unlock = useUnlockPanel();
  const [password, setPassword] = useState("");

  return (
    <Door data-gc="configuracoes.painel-trancado.door"
      icon={<LockKeyhole data-gc="configuracoes.painel-trancado.lock-keyhole" size={22} />}
      title="Painel trancado"
      detail={`Digite a senha de administração de ${email}. Ela é separada da senha da conta.`}
    >
      <form data-gc="configuracoes.painel-trancado.form"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (password) unlock.mutate(password, { onSuccess: () => setPassword("") });
        }}
      >
        <div data-gc="configuracoes.painel-trancado.div">
          <Label data-gc="configuracoes.painel-trancado.label">Senha do painel</Label>
          <Input data-gc="configuracoes.painel-trancado.input" type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {unlock.isError && <p data-gc="configuracoes.painel-trancado.p" className="text-sm text-danger">{apiErrorMessage(unlock.error, "Não abriu.")}</p>}

        <Button data-gc="configuracoes.painel-trancado.button" type="submit" className="w-full" disabled={!password || unlock.isPending}>
          <KeyRound data-gc="configuracoes.painel-trancado.key-round" size={16} /> Abrir o painel
        </Button>
      </form>
    </Door>
  );
};

export const PanelChangePassword: React.FC = () => {
  const change = useChangePanelPassword();
  const [current, setCurrent] = useState("");
  const [fresh, setFresh] = useState("");
  const [again, setAgain] = useState("");

  const mismatch = again.length > 0 && fresh !== again;
  const valid = current.length > 0 && fresh.length >= ADMIN_PASSWORD_MIN && fresh === again;

  return (
    <Door data-gc="configuracoes.painel-trancado.door--2"
      icon={<ShieldAlert data-gc="configuracoes.painel-trancado.shield-alert" size={22} />}
      title="Troque a senha provisória"
      detail="Quem te adicionou escolheu essa senha. Antes de usar o painel, crie uma que só você sabe."
    >
      <form data-gc="configuracoes.painel-trancado.form--2"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) change.mutate({ current, fresh });
        }}
      >
        <div data-gc="configuracoes.painel-trancado.div--2">
          <Label data-gc="configuracoes.painel-trancado.label--2">Senha provisória</Label>
          <Input data-gc="configuracoes.painel-trancado.input--2" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div data-gc="configuracoes.painel-trancado.div--3">
          <Label data-gc="configuracoes.painel-trancado.label--3">Senha nova</Label>
          <Input data-gc="configuracoes.painel-trancado.input--3" type="password" autoComplete="new-password" value={fresh} onChange={(e) => setFresh(e.target.value)} />
          <p data-gc="configuracoes.painel-trancado.p--2" className="mt-1 text-xs text-ink-faint">Pelo menos {ADMIN_PASSWORD_MIN} caracteres.</p>
        </div>
        <div data-gc="configuracoes.painel-trancado.div--4">
          <Label data-gc="configuracoes.painel-trancado.label--4">Repita a senha nova</Label>
          <Input data-gc="configuracoes.painel-trancado.input--4" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} error={mismatch ? "As duas não batem." : undefined} />
        </div>

        {change.isError && <p data-gc="configuracoes.painel-trancado.p--3" className="text-sm text-danger">{apiErrorMessage(change.error, "Não trocou.")}</p>}

        <Button data-gc="configuracoes.painel-trancado.button--2" type="submit" className="w-full" disabled={!valid || change.isPending}>
          Trocar e abrir o painel
        </Button>
      </form>
    </Door>
  );
};

const Door: React.FC<{ icon: React.ReactNode; title: string; detail: string; children: React.ReactNode }> = ({
  icon,
  title,
  detail,
  children,
}) => (
  <div data-gc="configuracoes.painel-trancado.div--5" className="flex h-full items-center justify-center p-6">
    <div data-gc="configuracoes.painel-trancado.div--6" className="w-full max-w-sm rounded-xl border border-line bg-surface-1 p-6 shadow-2xl">
      <span data-gc="configuracoes.painel-trancado.span" className="flex size-11 items-center justify-center rounded-xl bg-brand/15 text-brand">{icon}</span>
      <h2 data-gc="configuracoes.painel-trancado.h2" className="mt-4 text-lg font-semibold">{title}</h2>
      <p data-gc="configuracoes.painel-trancado.p--4" className="mt-1 text-sm text-ink-muted">{detail}</p>
      <div data-gc="configuracoes.painel-trancado.div--7" className="mt-5">{children}</div>
    </div>
  </div>
);
