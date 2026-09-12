import React from "react";
import { CrownSimple } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { cn } from "~/lib/utils";

/*
  A coroa de quem é dono do servidor.

  Era o emoji 👑, e num tamanho de 14 px o emoji vira uma mancha amarela: o
  desenho dele foi feito para 32 px ou mais, e o navegador ainda o pinta com a
  fonte de emoji do sistema, então a mesma tela muda de cara entre um Mac e um
  Windows.

  Aqui é ícone da mesma família do resto da interface, preenchido, na cor de
  destaque do tema. Um desenho só, do nosso tamanho, e igual em todo lugar.
*/
export const OwnerSeal: React.FC<{ size?: number; className?: string }> = ({
  size = 14,
  className,
}) => (
  <Tooltip data-gc="servidor.selo-de-dono.tooltip" label="Dono do servidor">
    <span data-gc="servidor.selo-de-dono.span"
      aria-label="Dono do servidor"
      className={cn("flex shrink-0 items-center text-destaque", className)}
    >
      <CrownSimple data-gc="servidor.selo-de-dono.crown-simple" size={size} weight="fill" />
    </span>
  </Tooltip>
);
