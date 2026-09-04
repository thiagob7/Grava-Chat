import React from "react";

import { cn } from "~/lib/utils";

export const Skeleton: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className,
  style,
}) => (
  <span
    aria-hidden
    style={style}
    className={cn("block animate-pulse rounded bg-ink-faint/15", className)}
  />
);

const LARGURAS = ["92%", "64%", "78%", "45%", "85%", "58%", "70%", "38%"];

export const larguraDaLinha = (indice: number) =>
  LARGURAS[indice % LARGURAS.length]!;
