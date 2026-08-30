import React, { useState } from "react";

import { useDevLogin } from "~/@core/application/queries/auth/use-dev-login";
import { useSession } from "~/contexts/session-context";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { FundoDaMarca } from "~/components/FundoDaMarca";
import { desktop } from "~/lib/desktop";

export const SignIn: React.FC = () => {
  const devLogin = useDevLogin();
  const { devLoginEnabled, googleEnabled, apiUnreachable, retry, startSession } = useSession();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    <div className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <FundoDaMarca className="pointer-events-none absolute inset-0" />

      {/*
        Cartão partido em dois: a marca de um lado, o formulário do outro.

        A versão anterior empilhava tudo numa coluna estreita, e a marca virava
        um logotipo pequeno espremido em cima dos campos. Numa tela que é a
        primeira coisa que alguém de fora vê, a marca merece metade do espaço —
        e o formulário, livre daquele aperto, respira.

        Em tela estreita a divisão vira empilhamento: duas colunas de 200px de
        largura não seriam nem marca nem formulário.
      */}
      <div className="relative grid w-full max-w-3xl overflow-hidden rounded-xl bg-surface-1 shadow-2xl ring-1 ring-white/10 sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <aside className="flex flex-col items-center justify-center gap-4 border-b border-divisor bg-surface-0 px-8 py-10 sm:border-b-0 sm:border-r">
          <span className="flex size-24 items-center justify-center rounded-full bg-brand">
            <img
              src="/brand/logo%20g%20branco.svg"
              alt=""
              className="h-12 w-auto"
              draggable={false}
            />
          </span>

          <img src="/brand/logotipo.png" alt="Gravaê" className="h-7 w-auto" draggable={false} />

          <p className="max-w-[15rem] text-center text-xs leading-relaxed text-ink-faint">
            Conversa, voz e vídeo com os seus. Sem cobrar, sem anúncio, sem
            vender o que você fala.
          </p>
        </aside>

        <div className="px-8 py-10">
        <div className="mb-6">
          <h1 className="text-xl font-semibold">Boas-vindas de volta</h1>
          <p className="mt-1 text-sm text-ink-muted">Que bom te ver de novo.</p>
        </div>

        {ponte ? (
          <Button
            disabled={!googleEnabled}
            variant="surface"
            title={googleEnabled ? undefined : "Configure GOOGLE_CLIENT_ID no .env"}
            className="mb-2 w-full bg-white/90 text-black/80 hover:bg-white"
            onClick={() => ponte.login.iniciar()}
          >
            <GoogleMark /> Entrar com Google
          </Button>
        ) : (
          <Button
            asChild={googleEnabled}
            disabled={!googleEnabled}
            variant="surface"
            title={googleEnabled ? undefined : "Configure GOOGLE_CLIENT_ID no .env"}
            className="mb-4 w-full bg-white/90 text-black/80 hover:bg-white"
          >
            {googleEnabled ? (
              <a href="/api/auth/google">
                <GoogleMark /> Entrar com Google
              </a>
            ) : (
              <span className="inline-flex items-center gap-2">
                <GoogleMark /> Entrar com Google
              </span>
            )}
          </Button>
        )}

        {ponte && googleEnabled && (
          <p className="mb-4 text-center text-xs text-ink-faint">
            Abre no seu navegador e volta pra cá sozinho.
          </p>
        )}

        {new URLSearchParams(window.location.search).get("erro") === "google" && (
          <p className="mb-4 rounded bg-danger/15 px-3 py-2 text-center text-sm text-danger">
            O login com Google falhou. Tente de novo.
          </p>
        )}

        {/*
          O aviso mudou de tom porque o comportamento mudou: a consulta agora
          insiste sozinha e segue tentando de fundo (ver `use-auth-config.ts`).
          Chamar isso de erro definitivo, com um botão de "tentar de novo" como
          única saída, era pedir uma ação que o app já está tomando.
        */}
        {apiUnreachable && (
          <div className="rounded bg-idle/15 p-3 text-center">
            <p className="flex items-center justify-center gap-2 text-sm text-idle">
              <span className="size-1.5 animate-pulse rounded-full bg-idle" />
              Reconectando…
            </p>
            <p className="mt-1 text-xs text-ink-muted">
              O servidor pode estar reiniciando. Isso volta sozinho.
            </p>
            <Button variant="link" size="sm" onClick={retry} className="mt-1">
              Tentar agora
            </Button>
          </div>
        )}

        {devLoginEnabled && (
          <>
            <div className="mb-4 flex items-center gap-2">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs uppercase text-ink-faint">ou, em desenvolvimento</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="voce@gravae.io"
              className="mb-3"
            />

            <Label htmlFor="display-name">Nome de exibição</Label>
            <Input
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="Como seus amigos te chamam"
            />

            {error && <p className="mt-2 text-sm text-danger">{error}</p>}

            <Button
              onClick={() => void submit()}
              disabled={devLogin.isPending}
              className="mt-5 w-full"
            >
              {devLogin.isPending ? "Entrando…" : "Entrar"}
            </Button>

            <p className="mt-4 text-center text-xs text-ink-faint">
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
  <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
    <path fill="#4285F4" d="M45 24c0-1.6-.1-2.7-.4-4H24v8h12c-.2 2-1.6 5-4.6 7l7 5.4C42.6 36.5 45 30.8 45 24z" />
    <path fill="#34A853" d="M24 46c6 0 11-2 14.7-5.4l-7-5.4C29.7 36.4 27.1 37.2 24 37.2c-5.8 0-10.7-3.9-12.5-9.1l-7.3 5.6C7.9 41.2 15.3 46 24 46z" />
    <path fill="#FBBC05" d="M11.5 28.1c-.5-1.4-.7-2.9-.7-4.1s.3-2.8.7-4.1l-7.3-5.7C2.8 17.1 2 20.4 2 24s.8 6.9 2.2 9.8l7.3-5.7z" />
    <path fill="#EA4335" d="M24 10.8c3.3 0 6.2 1.1 8.5 3.3l6.3-6.3C35 4.1 30 2 24 2 15.3 2 7.9 6.8 4.2 14.2l7.3 5.7c1.8-5.2 6.7-9.1 12.5-9.1z" />
  </svg>
);
