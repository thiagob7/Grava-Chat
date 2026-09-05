import React, { useEffect, useRef } from "react";

export const AreaDeConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.area-de-conversa.div" className="area-de-conversa relative flex min-h-0 flex-1 flex-col">{children}</div>
);

export const RodapeDaConversa: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const rodape = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const alvo = rodape.current;
    const area = alvo?.parentElement;
    if (!alvo || !area || typeof ResizeObserver === "undefined") return;

    const observador = new ResizeObserver(() => {
      area.style.setProperty("--gc-rodape", `${Math.round(alvo.offsetHeight)}px`);
    });

    observador.observe(alvo);
    return () => {
      observador.disconnect();
      area.style.removeProperty("--gc-rodape");
    };
  }, []);

  return (
    <div data-gc="conversa.area-de-conversa.div--2" ref={rodape} className="absolute inset-x-0 bottom-0 z-10">
      {children}
    </div>
  );
};
