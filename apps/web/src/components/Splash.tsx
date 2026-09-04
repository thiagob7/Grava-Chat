import React from "react";

export const Splash: React.FC<{ legenda?: React.ReactNode }> = ({ legenda }) => (
  <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-surface-2">
    <img
      src="/brand/logo g branco.svg"
      alt=""
      className="h-12 w-auto animate-pulse select-none"
      draggable={false}
    />

    {legenda}
  </div>
);
