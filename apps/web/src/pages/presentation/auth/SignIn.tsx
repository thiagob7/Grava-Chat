import React, { useState } from "react";

import { useDevLogin } from "~/@core/application/queries/auth/use-dev-login";
import { useEntrar, usePedirSenhaNova, useRegistrar } from "~/@core/application/queries/auth/use-senha";
import { apiErrorMessage } from "~/@core/lib/api";
import { useSession } from "~/contexts/session-context";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { FundoDaMarca } from "~/features/app/components/FundoDaMarca";
import { desktop } from "~/lib/desktop";
import { flx } from "~/lib/compat-de-tema";

export const SignIn: React.FC = () => {
  const devLogin = useDevLogin();
  const entrar = useEntrar();
  const registrar = useRegistrar();
  const pedirSenhaNova = usePedirSenhaNova();
  const {
    devLoginEnabled,
    googleEnabled,
    senhaEnabled,
    esqueciSenhaEnabled,
    apiUnreachable,
    retry,
    startSession,
  } = useSession();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  /*
    Entrar, criar conta ou pedir senha nova: o mesmo cartão, três estados. O
    de pedir some com os campos de senha e nome e fica só com o e-mail, que é
    tudo o que o servidor precisa.
  */
  const [modo, setModo] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [pedido, setPedido] = useState(false);
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [erroDaSenha, setErroDaSenha] = useState<string | null>(null);
  const ocupado = entrar.isPending || registrar.isPending || pedirSenhaNova.isPending;

  /*
    O pedido responde a mesma coisa exista a conta ou não — de propósito. Se
    a tela dissesse "esse e-mail não tem conta", ela viraria um jeito de
    descobrir quem está aqui.
  */
  const pedirNova = async () => {
    if (!email.includes("@")) return setErroDaSenha("Informe um e-mail válido");

    setErroDaSenha(null);

    try {
      await pedirSenhaNova.mutateAsync(email.trim());
      setPedido(true);
    } catch (erro) {
      setErroDaSenha(apiErrorMessage(erro, "Não deu para pedir agora."));
    }
  };

  const comSenha = async () => {
    if (modo === "esqueci") return pedirNova();
    if (!email.includes("@")) return setErroDaSenha("Informe um e-mail válido");
    if (senha.length < 8) return setErroDaSenha("A senha precisa de pelo menos 8 caracteres");
    if (modo === "criar" && !nome.trim()) return setErroDaSenha("Diga como quer ser chamado");

    setErroDaSenha(null);

    try {
      const session =
        modo === "criar"
          ? await registrar.mutateAsync({ email: email.trim(), senha, displayName: nome.trim() })
          : await entrar.mutateAsync({ email: email.trim(), senha });

      startSession(session.user);
    } catch (erro) {
      setErroDaSenha(apiErrorMessage(erro, "Não deu para entrar."));
    }
  };

  const ponte = desktop();

  const submit = async () => {
    if (!email.includes("@")) return setError("Informe um email válido");

    setError(null);
    const session = await devLogin
      .mutateAsync({ email: email.trim(), displayName: name.trim() || email.split("@")[0] })
      .catch(() => null);

    if (session) startSession(session.user);
  };

  return (
    <div data-gc="auth.sign-in.div" className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <FundoDaMarca data-gc="auth.sign-in.fundo-da-marca" className="pointer-events-none absolute inset-0" />

      <div data-gc="auth.sign-in.div--2" {...flx("cartaoDeEntrada", "relative grid w-full max-w-3xl overflow-hidden rounded-xl bg-surface-1 shadow-2xl ring-1 ring-line-sutil sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)]")}>
        <aside data-gc="auth.sign-in.aside" className="flex flex-col items-center justify-center gap-4 border-b border-divisor bg-surface-0 px-8 py-10 sm:border-b-0 sm:border-r">
          <img data-gc="auth.sign-in.img"
            src="/brand/logo%20g%20branco.svg"
            alt=""
            className="h-20 w-auto"
            draggable={false}
          />

          <img data-gc="auth.sign-in.img--2" src="/brand/logotipo.png" alt="Gravaê" className="h-7 w-auto" draggable={false} />

          <p data-gc="auth.sign-in.p" className="max-w-[15rem] text-center text-xs leading-relaxed text-ink-faint">
            Conversa, voz e vídeo com os seus. Sem cobrar, sem anúncio, sem
            vender o que você fala.
          </p>
        </aside>

        <div data-gc="auth.sign-in.div--3" className="px-8 py-10">
        <div data-gc="auth.sign-in.div--4" className="mb-6">
          <h1 data-gc="auth.sign-in.h1" className="text-xl font-semibold">Boas-vindas de volta</h1>
          <p data-gc="auth.sign-in.p--2" className="mt-1 text-sm text-ink-muted">Que bom te ver de novo.</p>
        </div>

        {ponte ? (
          <Button data-gc="auth.sign-in.button"
            disabled={!googleEnabled}
            variant="surface"
            title={googleEnabled ? undefined : "Configure GOOGLE_CLIENT_ID no .env"}
            className="mb-2 w-full bg-sobre-marca/90 text-ink/80 hover:bg-sobre-marca"
            onClick={() => ponte.login.iniciar()}
          >
            <GoogleMark data-gc="auth.sign-in.google-mark" /> Entrar com Google
          </Button>
        ) : (
          <Button data-gc="auth.sign-in.button--2"
            asChild={googleEnabled}
            disabled={!googleEnabled}
            variant="surface"
            title={googleEnabled ? undefined : "Configure GOOGLE_CLIENT_ID no .env"}
            className="mb-4 w-full bg-sobre-marca/90 text-ink/80 hover:bg-sobre-marca"
          >
            {googleEnabled ? (
              <a data-gc="auth.sign-in.a" href="/api/auth/google">
                <GoogleMark data-gc="auth.sign-in.google-mark--2" /> Entrar com Google
              </a>
            ) : (
              <span data-gc="auth.sign-in.span" className="inline-flex items-center gap-2">
                <GoogleMark data-gc="auth.sign-in.google-mark--3" /> Entrar com Google
              </span>
            )}
          </Button>
        )}

        {ponte && googleEnabled && (
          <p data-gc="auth.sign-in.p--3" className="mb-4 text-center text-xs text-ink-faint">
            Abre no seu navegador e volta pra cá sozinho.
          </p>
        )}

        {new URLSearchParams(window.location.search).get("erro") === "google" && (
          <p data-gc="auth.sign-in.p--4" className="mb-4 rounded bg-danger/15 px-3 py-2 text-center text-sm text-danger">
            O login com Google falhou. Tente de novo.
          </p>
        )}

        {apiUnreachable && (
          <div data-gc="auth.sign-in.div--5" className="rounded bg-idle/15 p-3 text-center">
            <p data-gc="auth.sign-in.p--5" className="flex items-center justify-center gap-2 text-sm text-idle">
              <span data-gc="auth.sign-in.span--2" className="size-1.5 animate-pulse rounded-full bg-idle" />
              Reconectando…
            </p>
            <p data-gc="auth.sign-in.p--6" className="mt-1 text-xs text-ink-muted">
              O servidor pode estar reiniciando. Isso volta sozinho.
            </p>
            <Button data-gc="auth.sign-in.button.retry" variant="link" size="sm" onClick={retry} className="mt-1">
              Tentar agora
            </Button>
          </div>
        )}

        {senhaEnabled && (
          <>
            <div data-gc="auth.sign-in.div--6" className="mb-4 flex items-center gap-2">
              <span data-gc="auth.sign-in.span--3" className="h-px flex-1 bg-line" />
              <span data-gc="auth.sign-in.span--4" className="text-xs uppercase text-ink-faint">
                {modo === "criar" ? "ou crie uma conta" : modo === "esqueci" ? "recuperar a senha" : "ou entre com e-mail"}
              </span>
              <span data-gc="auth.sign-in.span--5" className="h-px flex-1 bg-line" />
            </div>

            <Label data-gc="auth.sign-in.label" htmlFor="email-senha">E-mail</Label>
            <Input data-gc="auth.sign-in.input"
              id="email-senha"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void comSenha()}
              placeholder="voce@exemplo.com"
              className="mb-3"
            />

            {modo === "criar" && (
              <>
                <Label data-gc="auth.sign-in.label--2" htmlFor="nome-de-exibicao">Nome de exibição</Label>
                <Input data-gc="auth.sign-in.input--2"
                  id="nome-de-exibicao"
                  autoComplete="nickname"
                  value={nome}
                  maxLength={32}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void comSenha()}
                  placeholder="Como seus amigos te chamam"
                  className="mb-3"
                />
              </>
            )}

            {modo !== "esqueci" && (
              <>
                <div data-gc="auth.sign-in.div--7" className="flex items-baseline justify-between">
                  <Label data-gc="auth.sign-in.label--3" htmlFor="senha">Senha</Label>

                  {modo === "entrar" && esqueciSenhaEnabled && (
                    <button data-gc="auth.sign-in.button--3"
                      type="button"
                      onClick={() => {
                        setModo("esqueci");
                        setErroDaSenha(null);
                        setPedido(false);
                      }}
                      className="text-xs font-medium text-link hover:underline"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>

                <Input data-gc="auth.sign-in.input--3"
                  id="senha"
                  type="password"
                  autoComplete={modo === "criar" ? "new-password" : "current-password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void comSenha()}
                  placeholder={modo === "criar" ? "Pelo menos 8 caracteres" : "Sua senha"}
                  erro={erroDaSenha ?? undefined}
                />
              </>
            )}

            {modo === "esqueci" &&
              (pedido ? (
                <p data-gc="auth.sign-in.p--7" className="rounded bg-surface-2 px-3 py-2 text-sm text-ink-muted">
                  Se houver uma conta com esse e-mail, o link de senha nova já está a caminho.
                  Ele vale por 30 minutos.
                </p>
              ) : (
                <p data-gc="auth.sign-in.p--8" className="text-xs text-ink-faint">
                  Mandamos um link para escolher uma senha nova. Ele vale por 30 minutos e só
                  serve uma vez.
                  {erroDaSenha && <span data-gc="auth.sign-in.span--6" className="mt-1 block text-danger">{erroDaSenha}</span>}
                </p>
              ))}

            {!(modo === "esqueci" && pedido) && (
              <Button data-gc="auth.sign-in.button--4" onClick={() => void comSenha()} disabled={ocupado} className="mt-5 w-full">
                {ocupado
                  ? "Um instante…"
                  : modo === "criar"
                    ? "Criar conta"
                    : modo === "esqueci"
                      ? "Mandar o link"
                      : "Entrar"}
              </Button>
            )}

            <p data-gc="auth.sign-in.p--9" className="mt-3 text-center text-xs text-ink-faint">
              {modo === "esqueci" ? (
                <button data-gc="auth.sign-in.button--5"
                  type="button"
                  onClick={() => {
                    setModo("entrar");
                    setErroDaSenha(null);
                    setPedido(false);
                  }}
                  className="font-medium text-link hover:underline"
                >
                  Voltar para entrar
                </button>
              ) : (
                <>
                  {modo === "criar" ? "Já tem conta?" : "Ainda não tem conta?"}{" "}
                  <button data-gc="auth.sign-in.button--6"
                    type="button"
                    onClick={() => {
                      setModo(modo === "criar" ? "entrar" : "criar");
                      setErroDaSenha(null);
                    }}
                    className="font-medium text-link hover:underline"
                  >
                    {modo === "criar" ? "Entrar" : "Criar uma"}
                  </button>
                </>
              )}
            </p>
          </>
        )}

        {devLoginEnabled && (
          <>
            <div data-gc="auth.sign-in.div--8" className="mb-4 flex items-center gap-2">
              <span data-gc="auth.sign-in.span--7" className="h-px flex-1 bg-line" />
              <span data-gc="auth.sign-in.span--8" className="text-xs uppercase text-ink-faint">ou, em desenvolvimento</span>
              <span data-gc="auth.sign-in.span--9" className="h-px flex-1 bg-line" />
            </div>

            <Label data-gc="auth.sign-in.label--4" htmlFor="email">Email</Label>
            <Input data-gc="auth.sign-in.input--4"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="voce@exemplo.com"
              className="mb-3"
            />

            <Label data-gc="auth.sign-in.label--5" htmlFor="display-name">Nome de exibição</Label>
            <Input data-gc="auth.sign-in.input--5"
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="Como seus amigos te chamam"
            />

            {error && <p data-gc="auth.sign-in.p--10" className="mt-2 text-sm text-danger">{error}</p>}

            <Button data-gc="auth.sign-in.button--7"
              onClick={() => void submit()}
              disabled={devLogin.isPending}
              className="mt-5 w-full"
            >
              {devLogin.isPending ? "Entrando…" : "Entrar"}
            </Button>

            <p data-gc="auth.sign-in.p--11" className="mt-4 text-center text-xs text-ink-faint">
              Login de desenvolvimento: cria a conta na hora, sem senha. Some em produção.
            </p>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

const GoogleMark: React.FC = () => (
  <svg data-gc="auth.sign-in.svg" width="16" height="16" viewBox="0 0 48 48" aria-hidden>
    <path data-gc="auth.sign-in.path" fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v8h12c-.2 2-1.6 5-4.6 7l7 5.4C42.6 36.5 45 30.8 45 24z" />
    <path data-gc="auth.sign-in.path--2" fill="#34A853" d="M24 46c6 0 11-2 14.7-5.4l-7-5.4C29.7 36.4 27.1 37.2 24 37.2c-5.8 0-10.7-3.9-12.5-9.1l-7.3 5.6C7.9 41.2 15.3 46 24 46z" />
    <path data-gc="auth.sign-in.path--3" fill="#FBBC05" d="M11.5 28.1c-.5-1.4-.7-2.9-.7-4.1s.3-2.8.7-4.1l-7.3-5.7C2.8 17.1 2 20.4 2 24s.8 6.9 2.2 9.8l7.3-5.7z" />
    <path data-gc="auth.sign-in.path--4" fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.3 2 7.9 6.8 4.2 14.2l7.3 5.7c1.8-5.2 6.7-9.1 12.5-9.1z" />
  </svg>
);
