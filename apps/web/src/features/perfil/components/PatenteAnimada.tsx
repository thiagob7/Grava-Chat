import React, { useCallback, useRef } from "react";
import type { Rank } from "@gravae/shared";

import { useLottie } from "~/features/perfil/lib/lottie";
import { loadRank, isRankWithArt, rankRatio } from "~/features/perfil/lib/patentes";
import { PROFILE_RANKS } from "~/features/perfil/lib/catalogo";

interface RankAnimatedProps {
  rank: Rank;
  animate: boolean;
  height?: number;
}

export const RankAnimated: React.FC<RankAnimatedProps> = ({
  rank,
  animate,
  height = 20,
}) => {
  const box = useRef<HTMLSpanElement>(null);

  useLottie(box, {
    key: rank,
    load: useCallback(() => loadRank(rank), [rank]),
    animate,
    repeat: false,
  });

  if (!isRankWithArt(rank)) return null;

  const label = PROFILE_RANKS.find((o) => o.id === rank)?.label ?? rank;

  return (
    <span data-gc="perfil.patente-animada.span"
      ref={box}
      role="img"
      aria-label={label}
      title={label}
      className="inline-block shrink-0 align-middle"
      style={{ height: height, width: Math.round(height * rankRatio(rank)) }}
    />
  );
};
