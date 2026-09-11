import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

import { useConfirmEmail } from "~/@core/application/queries/auth/use-senha";
import { apiErrorMessage } from "~/@core/lib/api";
import { Button } from "~/components/ui/button";
import { BrandBackground } from "~/features/app/components/FundoDaMarca";
import { useTranslation } from "~/traducao";

export const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const confirm = useConfirmEmail();

  const token = params.get("token") ?? "";
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tried = useRef(false);

  useEffect(() => {
    if (!token || tried.current) return;
    tried.current = true;

    confirm
      .mutateAsync(token)
      .then(() => setReady(true))
      .catch((e) => setError(apiErrorMessage(e, t("configuracoes.email.expirou"))));
  }, [token, confirm, t]);

  return (
    <div data-gc="auth.verificar-email.div" className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <BrandBackground data-gc="auth.verificar-email.brand-background" className="pointer-events-none absolute inset-0" />

      <div data-gc="auth.verificar-email.div--2" className="relative w-full max-w-sm rounded-xl bg-surface-1 px-8 py-10 text-center shadow-2xl ring-1 ring-line-sutil">
        <img data-gc="auth.verificar-email.img"
          src="/brand/logo%20g%20branco.svg"
          alt=""
          className="mx-auto mb-6 h-12 w-auto"
          draggable={false}
        />

        {!token ? (
          <>
            <h1 data-gc="auth.verificar-email.h1" className="text-lg font-semibold">
              {t("configuracoes.email.linkIncompleto")}
            </h1>
            <p data-gc="auth.verificar-email.p" className="mt-1 text-sm text-ink-muted">
              {t("configuracoes.email.linkIncompletoDetalhe")}
            </p>
          </>
        ) : ready ? (
          <>
            <h1 data-gc="auth.verificar-email.h1--2" className="text-lg font-semibold">
              {t("configuracoes.email.confirmado")}
            </h1>
            <p data-gc="auth.verificar-email.p--2" className="mt-1 text-sm text-ink-muted">
              {t("configuracoes.email.confirmadoDetalhe")}
            </p>

            <Button data-gc="auth.verificar-email.button" className="mt-5 w-full" onClick={() => navigate("/", { replace: true })}>
              {t("configuracoes.email.irParaOApp")}
            </Button>
          </>
        ) : error ? (
          <>
            <h1 data-gc="auth.verificar-email.h1--3" className="text-lg font-semibold">
              {t("configuracoes.email.linkIncompleto")}
            </h1>
            <p data-gc="auth.verificar-email.p--3" className="mt-1 text-sm text-ink-muted">{error}</p>

            <Button data-gc="auth.verificar-email.button--2"
              variant="surface"
              className="mt-5 w-full"
              onClick={() => navigate("/", { replace: true })}
            >
              {t("configuracoes.email.irParaOApp")}
            </Button>
          </>
        ) : (
          <p data-gc="auth.verificar-email.p--4" className="text-sm text-ink-muted">
            {t("configuracoes.email.confirmando")}
          </p>
        )}
      </div>
    </div>
  );
};
