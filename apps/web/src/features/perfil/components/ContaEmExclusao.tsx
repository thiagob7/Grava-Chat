import React from "react";
import { ShieldAlert } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { useCancelDeletion } from "~/@core/application/queries/conta/use-exclusao";
import { Button } from "~/components/ui/button";

interface AccountDeletionProps {
  user: SelfUserModel;
  onLeave: () => void;
}

function daysMissing(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export const AccountDeletion: React.FC<AccountDeletionProps> = ({ user, onLeave }) => {
  const recover = useCancelDeletion();
  const days = user.deleteAt ? daysMissing(user.deleteAt) : 0;

  const when = user.deleteAt
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(user.deleteAt))
    : "";

  return (
    <div data-gc="perfil.conta-em-exclusao.div" className="flex h-full items-center justify-center bg-surface-1 p-6">
      <div data-gc="perfil.conta-em-exclusao.div--2" className="w-full max-w-md rounded-xl border border-line bg-surface-2 p-6 text-center">
        <div data-gc="perfil.conta-em-exclusao.div--3" className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger-fundo text-danger">
          <ShieldAlert data-gc="perfil.conta-em-exclusao.shield-alert" size={24} />
        </div>

        <h1 data-gc="perfil.conta-em-exclusao.h1" className="mt-4 text-lg font-semibold">Esta conta está marcada para exclusão</h1>

        <p data-gc="perfil.conta-em-exclusao.p" className="mt-2 text-sm text-ink-muted">
          {days === 0
            ? "O prazo acaba hoje."
            : `Faltam ${days} ${days === 1 ? "dia" : "dias"} — até ${when}.`}{" "}
          <strong data-gc="perfil.conta-em-exclusao.strong" className="text-ink">Nada foi apagado ainda</strong>: as suas mensagens, amizades
          e servidores continuam onde estavam, e voltam inteiros se você recuperar agora.
        </p>

        <div data-gc="perfil.conta-em-exclusao.div--4" className="mt-6 flex flex-col gap-2">
          <Button data-gc="perfil.conta-em-exclusao.button"
            onClick={() => recover.mutate()}
            disabled={recover.isPending}
            className="w-full justify-center"
          >
            {recover.isPending ? "Recuperando…" : "Recuperar a minha conta"}
          </Button>

          <Button data-gc="perfil.conta-em-exclusao.button.on-leave" variant="ghost" onClick={onLeave} className="w-full justify-center">
            Sair
          </Button>
        </div>

        <p data-gc="perfil.conta-em-exclusao.p--2" className="mt-4 text-xs text-ink-faint">
          Depois de {when}, a conta e tudo o que ela guarda somem para sempre.
        </p>
      </div>
    </div>
  );
};
