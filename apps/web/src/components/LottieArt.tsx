import React, { useCallback, useRef } from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useLottie } from "~/features/perfil/lib/lottie";
import { cn } from "~/lib/utils";

interface LottieArtProps {
  name: string;
  load: () => Promise<unknown | null>;
  label: string;
  className?: string;
}

export const LottieArt: React.FC<LottieArtProps> = ({ name, load, label, className }) => {
  const box = useRef<HTMLSpanElement>(null);
  const stillImage = useAppearance((state) => state.reduceAnimation);

  useLottie(box, {
    key: name,
    load: useCallback(() => load(), [load]),
    animate: !stillImage,
    repeat: true,
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
