import React, { useEffect, useRef } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { cn } from "~/lib/utils";

/*
  A arte animada do topo da página do Infinity. O player do Lottie entra por
  import dinâmico: quem nunca abre a página não baixa a biblioteca junto com o
  app. Quem pediu menos movimento vê o primeiro quadro, parado.
*/
export const InfinityArt: React.FC<{ className?: string }> = ({ className }) => {
  const box = useRef<HTMLDivElement>(null);
  const still = useAppearance((s) => s.reduceAnimation);

  useEffect(() => {
    const target = box.current;
    if (!target) return;

    let animation: { destroy: () => void; goToAndStop: (value: number, isFrame?: boolean) => void } | null = null;
    let alive = true;

    void (async () => {
      const [{ default: lottie }, { default: data }] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        import("~/assets/lottie/infinity.json"),
      ]);
      if (!alive) return;

      animation = lottie.loadAnimation({
        container: target,
        renderer: "svg",
        loop: !still,
        autoplay: !still,
        animationData: data,
      });

      if (still) animation.goToAndStop(0, true);
    })();

    return () => {
      alive = false;
      animation?.destroy();
    };
  }, [still]);

  return <div data-gc="plan.infinity-art.div" ref={box} aria-hidden className={cn("pointer-events-none", className)} />;
};
