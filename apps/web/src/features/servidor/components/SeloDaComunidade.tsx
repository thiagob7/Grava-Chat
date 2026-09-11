import React from "react";
import { useTranslation } from "react-i18next";

import { Compass, Seal, SealCheck } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

interface CommunityPropsSeal {
  verified?: boolean | null;
  detectable?: boolean | null;
  size?: number;
  withoutHint?: boolean;
  className?: string;
}

export const CommunitySeal: React.FC<CommunityPropsSeal> = ({
  verified,
  detectable,
  size = 16,
  withoutHint = false,
  className,
}) => {
  const { t } = useTranslation();

  if (!verified && !detectable) return null;

  const label = verified ? t("servidor.selos.verificada") : t("servidor.selos.detectavel");

  const icon = verified ? (
    <SealCheck data-gc="servidor.selo-da-comunidade.seal-check" size={size} weight="fill" className={cn("shrink-0 text-brand", className)} aria-label={label} />
  ) : (
    <span data-gc="servidor.selo-da-comunidade.span"
      role="img"
      aria-label={label}
      className={cn("relative flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <Seal data-gc="servidor.selo-da-comunidade.seal" size={size} weight="fill" className="text-ink-muted" />

      <Compass data-gc="servidor.selo-da-comunidade.compass"
        size={Math.round(size * 0.58)}
        weight="bold"
        className="absolute text-surface-1"
      />
    </span>
  );

  if (withoutHint) return icon;

  return (
    <Tooltip data-gc="servidor.selo-da-comunidade.tooltip" label={label}>
      <span data-gc="servidor.selo-da-comunidade.span--2" className="flex shrink-0 items-center">{icon}</span>
    </Tooltip>
  );
};
