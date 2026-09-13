import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { ArrowSquareOut } from "@phosphor-icons/react";

import { LottieArt } from "~/components/LottieArt";
import { Button } from "~/components/ui/button";
import { BrandBackground } from "~/features/app/components/FundoDaMarca";
import { useTranslation } from "~/traducao";

const loadRobot = () => import("~/assets/animations/robot-hello.json").then((mod) => mod.default);
const loadCat = () => import("~/assets/animations/cat-crying.json").then((mod) => mod.default);

/*
  Onde o navegador para depois de entrar com o Google pelo aplicativo.

  O código de troca chega no fragmento (#codigo=...), e não na busca: o que vem
  depois do # nunca sai do navegador, então não fica em log de servidor nem em
  análise de acesso. Ele é lido uma vez, tirado da barra de endereço e entregue
  ao aplicativo pelo link gravae://.
*/
const readCode = () => new URLSearchParams(window.location.hash.slice(1)).get("codigo");

export const DesktopLoginDone: React.FC = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [code] = useState(readCode);

  const deepLink = code ? `gravae://auth?codigo=${encodeURIComponent(code)}` : null;
  const failed = params.has("erro") || !deepLink;
  const opened = useRef(false);

  useEffect(() => {
    if (!deepLink || opened.current) return;
    opened.current = true;

    window.history.replaceState(null, "", window.location.pathname);
    window.location.href = deepLink;
  }, [deepLink]);

  return (
    <div data-gc="auth.login-no-app.div" className="relative flex min-h-full items-center justify-center overflow-hidden p-6">
      <BrandBackground data-gc="auth.login-no-app.brand-background" className="pointer-events-none absolute inset-0" />

      <div data-gc="auth.login-no-app.div--2" className="relative w-full max-w-sm rounded-xl bg-surface-1 px-8 pb-8 pt-6 text-center shadow-2xl ring-1 ring-line-sutil">
        <LottieArt data-gc="auth.login-no-app.lottie-art"
          name={failed ? "cat-crying" : "robot-hello"}
          load={failed ? loadCat : loadRobot}
          label={failed ? t("comum.loginNoApp.legendaFalhou") : t("comum.loginNoApp.legenda")}
          className="mx-auto size-44"
        />

        {failed ? (
          <>
            <h1 data-gc="auth.login-no-app.h1" className="text-xl font-semibold">{t("comum.loginNoApp.falhouTitulo")}</h1>
            <p data-gc="auth.login-no-app.p" className="mt-2 text-sm text-ink-muted">{t("comum.loginNoApp.falhouDetalhe")}</p>
          </>
        ) : (
          <>
            <h1 data-gc="auth.login-no-app.h1--2" className="text-xl font-semibold">{t("comum.loginNoApp.titulo")}</h1>
            <p data-gc="auth.login-no-app.p--2" className="mt-2 text-sm text-ink-muted">{t("comum.loginNoApp.detalhe")}</p>

            <Button data-gc="auth.login-no-app.button" asChild className="mt-6 w-full">
              <a data-gc="auth.login-no-app.a" href={deepLink ?? undefined}>
                {t("comum.loginNoApp.abrir")} <ArrowSquareOut data-gc="auth.login-no-app.arrow-square-out" size={16} weight="bold" />
              </a>
            </Button>

            <p data-gc="auth.login-no-app.p--3" className="mt-3 text-xs text-ink-faint">{t("comum.loginNoApp.fecharAba")}</p>
          </>
        )}
      </div>
    </div>
  );
};
