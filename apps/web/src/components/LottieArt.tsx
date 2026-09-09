import React, { useCallback, useRef } from "react";

import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { usarLottie } from "~/features/perfil/lib/lottie";
import { cn } from "~/lib/utils";

interface LottieArtProps {
  name: string;
  load: () => Promise<unknown | null>;
  label: string;
  className?: string;
}

export const LottieArt: React.FC<LottieArtProps> = ({ name, load, label, className }) => {
  const box = useRef<HTMLSpanElement>(null);
  const stillImage = useAparencia((state) => state.reduzirAnimacao);

  usarLottie(box, {
    chave: name,
    carregar: useCallback(() => load(), [load]),
    animar: !stillImage,
    repetir: true,
  });

  return (
    <span data-gc="lottie-art.span"
      ref={box}
      role="img"
      aria-label={label}
      className={cn("block", className)}
    />
  );
};
