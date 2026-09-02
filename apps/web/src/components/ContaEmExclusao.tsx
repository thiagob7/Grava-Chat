import React from "react";
import { ShieldAlert } from "lucide-react";

import type { SelfUserModel } from "~/@core/domain/models/user-model";
import { useCancelarExclusao } from "~/@core/application/queries/conta/use-exclusao";
import { Button } from "~/components/ui/button";

interface ContaEmExclusaoProps {
  user: SelfUserModel;
  onSair: () => void;
}

/// Dias inteiros que faltam, arredondando pra cima: faltando algumas horas,
/// "0 dias" assustaria mais do que informaria.
function diasQueFaltam(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/*
  A tela de quem pediu para excluir a conta.

  Ela existe para que voltar seja uma DECISÃO, e não um acidente. Sem esta
  parada, entrar de novo devolveria a pessoa direto à conversa como se nada
  tivesse acontecido — e ela só descobriria que a exclusão foi cancelada
  quando o prazo passasse sem nada acontecer.

  O texto insiste que nada foi apagado porque é a única coisa que a pessoa
  precisa saber para decidir sem medo. "Excluída" costuma significar "perdi
  tudo"; aqui não significa, e dizer isso é obrigação de quem prometeu prazo.
*/
export const ContaEmExclusao: React.FC<ContaEmExclusaoProps> = ({ user, onSair }) => {
  const recuperar = useCancelarExclusao();
  const dias = user.excluirEm ? diasQueFaltam(user.excluirEm) : 0;

  const quando = user.excluirEm
    ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(new Date(user.excluirEm))
    : "";

  return (
    <div className="flex h-full items-center justify-center bg-surface-1 p-6">
      <div className="w-full max-w-md rounded-xl border border-line bg-surface-2 p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-danger/10 text-danger">
          <ShieldAlert size={24} />
        </div>

        <h1 className="mt-4 text-lg font-semibold">Esta conta está marcada para exclusão</h1>

        <p className="mt-2 text-sm text-ink-muted">
          {dias === 0
            ? "O prazo acaba hoje."
            : `Faltam ${dias} ${dias === 1 ? "dia" : "dias"} — até ${quando}.`}{" "}
          <strong className="text-ink">Nada foi apagado ainda</strong>: as suas mensagens, amizades
          e servidores continuam onde estavam, e voltam inteiros se você recuperar agora.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={() => recuperar.mutate()}
            disabled={recuperar.isPending}
            className="w-full justify-center"
          >
            {recuperar.isPending ? "Recuperando…" : "Recuperar a minha conta"}
          </Button>

          <Button variant="ghost" onClick={onSair} className="w-full justify-center">
            Sair
          </Button>
        </div>

        <p className="mt-4 text-xs text-ink-faint">
          Depois de {quando}, a conta e tudo o que ela guarda somem para sempre.
        </p>
      </div>
    </div>
  );
};
