import React, { useState } from "react";

import { useDevLogin } from "~/@core/application/queries/auth/use-dev-login";
import { useSession } from "~/contexts/session-context";
import { Button } from "~/components/ui/button";
import { Input, Label } from "~/components/ui/input";
import { FundoDaMarca } from "~/features/app/components/FundoDaMarca";
import { desktop } from "~/lib/desktop";
import { flx } from "~/lib/compat-fluxer";

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
    <div data-gc="auth.sign-in.div" className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <FundoDaMarca data-gc="auth.sign-in.fundo-da-marca" className="pointer-events-none absolute inset-0" />

      <div data-gc="auth.sign-in.div--2" {...flx("cartaoDeEntrada", "relative grid w-full max-w-3xl overflow-hidden rounded-xl bg-surface-1 shadow-2xl ring-1 ring-white/10 sm:grid-cols-[minmax(0,340px)_minmax(0,1fr)]")}>
        <aside data-gc="auth.sign-in.aside" className="flex flex-col items-center justify-center gap-4 border-b border-divisor bg-surface-0 px-8 py-10 sm:border-b-0 sm:border-r">
          <span data-gc="auth.sign-in.span" className="flex size-24 items-center justify-center rounded-full bg-brand">
            <img data-gc="auth.sign-in.img"
              src="/brand/logo%20g%20branco.svg"
              alt=""
              className="h-12 w-auto"
              draggable={false}
            />
          </span>

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
            className="mb-2 w-full bg-white/90 text-black/80 hover:bg-white"
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
            className="mb-4 w-full bg-white/90 text-black/80 hover:bg-white"
          >
            {googleEnabled ? (
              <a data-gc="auth.sign-in.a" href="/api/auth/google">
                <GoogleMark data-gc="auth.sign-in.google-mark--2" /> Entrar com Google
              </a>
            ) : (
              <span data-gc="auth.sign-in.span--2" className="inline-flex items-center gap-2">
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
              <span data-gc="auth.sign-in.span--3" className="size-1.5 animate-pulse rounded-full bg-idle" />
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

        {devLoginEnabled && (
          <>
            <div data-gc="auth.sign-in.div--6" className="mb-4 flex items-center gap-2">
              <span data-gc="auth.sign-in.span--4" className="h-px flex-1 bg-line" />
              <span data-gc="auth.sign-in.span--5" className="text-xs uppercase text-ink-faint">ou, em desenvolvimento</span>
              <span data-gc="auth.sign-in.span--6" className="h-px flex-1 bg-line" />
            </div>

            <Label data-gc="auth.sign-in.label" htmlFor="email">Email</Label>
            <Input data-gc="auth.sign-in.input"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="voce@gravae.io"
              className="mb-3"
            />

            <Label data-gc="auth.sign-in.label--2" htmlFor="display-name">Nome de exibição</Label>
            <Input data-gc="auth.sign-in.input--2"
              id="display-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void submit()}
              placeholder="Como seus amigos te chamam"
            />

            {error && <p data-gc="auth.sign-in.p--7" className="mt-2 text-sm text-danger">{error}</p>}

            <Button data-gc="auth.sign-in.button--3"
              onClick={() => void submit()}
              disabled={devLogin.isPending}
              className="mt-5 w-full"
            >
              {devLogin.isPending ? "Entrando…" : "Entrar"}
            </Button>

            <p data-gc="auth.sign-in.p--8" className="mt-4 text-center text-xs text-ink-faint">
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
