import React, { useEffect, useState } from "react";

import { LottieArt } from "~/components/LottieArt";
import { flx } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

const loadHand = () => import("~/assets/animations/loading.json").then((mod) => mod.default);

const WAIT_MS = 350;

export const Splash: React.FC<{ legenda?: React.ReactNode }> = ({ legenda }) => {
  const { t } = useTranslation();
  const [slow, setSlow] = useState(false);

  /*
    A mão só entra quando a espera passa de um terço de segundo. Abertura rápida
    mostra o logotipo e já troca de tela; sem essa pausa a animação piscaria no
    meio do caminho, o que incomoda mais do que ajuda.
  */
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div data-gc="app.splash.div" {...flx("opening", "flex min-h-full flex-col items-center justify-center gap-6 bg-surface-2")}>
      <img data-gc="app.splash.img"
        src="/brand/logo g branco.svg"
        alt=""
        className="h-12 w-auto select-none"
        draggable={false}
      />

      {slow && <LottieArt data-gc="app.splash.lottie-art" name="loading" load={loadHand} label={t("comum.carregando")} className="-my-2 w-24" />}

      {legenda}
    </div>
  );
};
