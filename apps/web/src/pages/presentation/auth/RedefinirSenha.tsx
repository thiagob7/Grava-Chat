import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { useRedefinirSenha } from "~/@core/application/queries/auth/use-senha";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { FundoDaMarca } from "~/features/app/components/FundoDaMarca";

export const RedefinirSenha: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redefinir = useRedefinirSenha();

  const token = params.get("token") ?? "";
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  const salvar = async () => {
    if (senha.length < 8) return setErro("A senha precisa de pelo menos 8 caracteres");
    if (senha !== repetida) return setErro("As duas não são iguais");

    setErro(null);

    try {
      await redefinir.mutateAsync({ token, senha });
      setPronto(true);
    } catch (e) {
      setErro(apiErrorMessage(e, "Não deu para trocar a senha."));
    }
  };

  return (
    <div data-gc="auth.redefinir-senha.div" className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <FundoDaMarca data-gc="auth.redefinir-senha.fundo-da-marca" className="pointer-events-none absolute inset-0" />

      <div data-gc="auth.redefinir-senha.div--2" className="relative w-full max-w-sm rounded-xl bg-surface-1 px-8 py-10 shadow-2xl ring-1 ring-line-sutil">
        <img data-gc="auth.redefinir-senha.img"
          src="/brand/logo%20g%20branco.svg"
          alt=""
          className="mx-auto mb-6 h-12 w-auto"
          draggable={false}
        />

        {!token ? (
          <>
            <h1 data-gc="auth.redefinir-senha.h1" className="text-lg font-semibold">Link incompleto</h1>
            <p data-gc="auth.redefinir-senha.p" className="mt-1 text-sm text-ink-muted">
              Falta o código no endereço. Abra o link direto do e-mail, sem copiar pela metade.
            </p>
          </>
        ) : pronto ? (
          <>
            <h1 data-gc="auth.redefinir-senha.h1--2" className="text-lg font-semibold">Senha trocada</h1>
            <p data-gc="auth.redefinir-senha.p--2" className="mt-1 text-sm text-ink-muted">
              As sessões que estavam abertas foram encerradas. Entre com a senha nova.
            </p>

            <Button data-gc="auth.redefinir-senha.button" className="mt-5 w-full" onClick={() => navigate("/login", { replace: true })}>
              Ir para entrar
            </Button>
          </>
        ) : (
          <>
            <h1 data-gc="auth.redefinir-senha.h1--3" className="text-lg font-semibold">Escolha uma senha nova</h1>
            <p data-gc="auth.redefinir-senha.p--3" className="mb-5 mt-1 text-sm text-ink-muted">
              Ela substitui a de antes em todos os aparelhos.
            </p>

            <Label data-gc="auth.redefinir-senha.label" htmlFor="senha-nova">Senha nova</Label>
            <Input data-gc="auth.redefinir-senha.input"
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void salvar()}
              placeholder="Pelo menos 8 caracteres"
              className="mb-3"
            />

            <Label data-gc="auth.redefinir-senha.label--2" htmlFor="senha-repetida">De novo</Label>
            <Input data-gc="auth.redefinir-senha.input--2"
              id="senha-repetida"
              type="password"
              autoComplete="new-password"
              value={repetida}
              onChange={(e) => setRepetida(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void salvar()}
              placeholder="A mesma coisa"
              error={erro ?? undefined}
            />

            <Button data-gc="auth.redefinir-senha.button--2" className="mt-5 w-full" disabled={redefinir.isPending} onClick={() => void salvar()}>
              {redefinir.isPending ? "Um instante…" : "Salvar a senha"}
            </Button>
          </>
        )}

        <p data-gc="auth.redefinir-senha.p--4" className="mt-4 text-center text-xs text-ink-faint">
          <Link data-gc="auth.redefinir-senha.link" to="/login" className="font-medium text-link hover:underline">
            Voltar para entrar
          </Link>
        </p>
      </div>
    </div>
  );
};
