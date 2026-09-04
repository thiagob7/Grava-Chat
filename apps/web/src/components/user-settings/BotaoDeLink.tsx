import React, { useState } from "react";
import { Link2 } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { copiarTexto } from "~/lib/copiar";
import { linkDaSecao } from "~/features/app/lib/link-de-config";
import type { Secao } from "~/components/user-settings/secoes";
import { cn } from "~/lib/utils";

interface BotaoDeLinkProps {
  secao: Secao;
  sub?: string;
  oQue: string;
}

export const BotaoDeLink: React.FC<BotaoDeLinkProps> = ({
  secao,
  sub,
  oQue,
}) => {
  const [copiado, setCopiado] = useState(false);

  return (
    <Tooltip
      label={copiado ? "Link copiado" : `Copiar link para ${oQue}`}
      side="top"
    >
      <button
        type="button"
        aria-label={`Copiar link para ${oQue}`}
        onClick={() => {
          void copiarTexto(linkDaSecao(secao, sub)).then((deu) => {
            if (!deu) return;

            setCopiado(true);
            window.setTimeout(() => setCopiado(false), 1500);
          });
        }}
        className={cn(
          "shrink-0 rounded p-1 text-ink-faint opacity-0 transition",
          "hover:bg-hover hover:text-ink focus-visible:opacity-100 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand/60 group-hover/titulo:opacity-100",
          copiado && "text-online opacity-100",
        )}
      >
        <Link2 size={15} />
      </button>
    </Tooltip>
  );
};
