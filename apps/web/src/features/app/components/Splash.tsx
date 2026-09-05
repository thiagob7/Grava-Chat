import React from "react";
import { flx } from "~/lib/compat-fluxer";

export const Splash: React.FC<{ legenda?: React.ReactNode }> = ({ legenda }) => (
  <div data-gc="app.splash.div" {...flx("abertura", "flex min-h-full flex-col items-center justify-center gap-6 bg-surface-2")}>
    <img data-gc="app.splash.img"
      src="/brand/logo g branco.svg"
      alt=""
      className="h-12 w-auto animate-pulse select-none"
      draggable={false}
    />

    {legenda}
  </div>
);
