import React from "react";
import { useNavigate } from "react-router";

import { Button } from "~/components/ui/button";
import { LottieArt } from "~/components/LottieArt";
import { BrandBackground } from "~/features/app/components/FundoDaMarca";
import { useTranslation } from "~/traducao";

const loadCat = () => import("~/assets/animations/not-found.json").then((mod) => mod.default);

export const NotFound: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div data-gc="not-found.not-found.div" className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-10">
      <BrandBackground data-gc="not-found.not-found.brand-background" className="pointer-events-none absolute inset-0" />

      <div data-gc="not-found.not-found.div--2" className="relative w-full max-w-sm rounded-xl bg-surface-1 px-8 py-10 text-center shadow-2xl ring-1 ring-line-sutil">
        <LottieArt data-gc="not-found.not-found.lottie-art" name="not-found" load={loadCat} label={t("comum.perdido.titulo")} className="mx-auto w-52" />

        <h1 data-gc="not-found.not-found.h1" className="mt-6 text-lg font-semibold">{t("comum.perdido.titulo")}</h1>
        <p data-gc="not-found.not-found.p" className="mt-1 text-sm text-ink-muted">{t("comum.perdido.detalhe")}</p>

        <Button data-gc="not-found.not-found.button" className="mt-6 w-full" onClick={() => navigate("/channels", { replace: true })}>
          {t("comum.voltar")}
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
