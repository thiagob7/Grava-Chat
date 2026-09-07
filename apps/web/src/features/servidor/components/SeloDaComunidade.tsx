import React from "react";
import { Compass, SealCheck } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

/*
  Os selos de comunidade, ao lado do nome do servidor.

  "Verificada" é marca da casa e vence: quem tem os dois mostra só ela.
  "Detectável" é a conta do Explorar — passou dos membros e não se escondeu.
  Sem nenhum dos dois, não desenha nada.
*/
interface SeloDaComunidadeProps {
  verificada?: boolean | null;
  detectavel?: boolean | null;
  tamanho?: number;
  /// Sem balão: para dentro de outro balão, onde um segundo não abre.
  semDica?: boolean;
  className?: string;
}

export const SeloDaComunidade: React.FC<SeloDaComunidadeProps> = ({
  verificada,
  detectavel,
  tamanho = 16,
  semDica = false,
  className,
}) => {
  const { t } = useTranslation();

  if (!verificada && !detectavel) return null;

  const rotulo = verificada ? t("servidor.selos.verificada") : t("servidor.selos.detectavel");

  const icone = verificada ? (
    <SealCheck data-gc="servidor.selo-da-comunidade.seal-check" size={tamanho} weight="fill" className={cn("shrink-0 text-brand", className)} aria-label={rotulo} />
  ) : (
    <Compass data-gc="servidor.selo-da-comunidade.compass" size={tamanho} weight="fill" className={cn("shrink-0 text-ink-muted", className)} aria-label={rotulo} />
  );

  if (semDica) return icone;

  return (
    <Tooltip data-gc="servidor.selo-da-comunidade.tooltip" label={rotulo}>
      <span data-gc="servidor.selo-da-comunidade.span" className="flex shrink-0 items-center">{icone}</span>
    </Tooltip>
  );
};
