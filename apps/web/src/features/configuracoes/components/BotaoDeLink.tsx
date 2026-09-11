import React, { useState } from "react";
import { Link2 } from "lucide-react";

import { Tooltip } from "~/components/ui/tooltip";
import { copyText } from "~/lib/copiar";
import { sectionLink } from "~/features/app/lib/link-de-config";
import type { Section } from "~/features/configuracoes/components/secoes";
import { cn } from "~/lib/utils";

interface LinkPropsButton {
  section: Section;
  sub?: string;
  oQue: string;
}

export const LinkButton: React.FC<LinkPropsButton> = ({
  section,
  sub,
  oQue,
}) => {
  const [copied, setCopied] = useState(false);

  return (
    <Tooltip data-gc="configuracoes.botao-de-link.tooltip"
      label={copied ? "Link copiado" : `Copiar link para ${oQue}`}
      side="top"
    >
      <button data-gc="configuracoes.botao-de-link.button"
        type="button"
        aria-label={`Copiar link para ${oQue}`}
        onClick={() => {
          void copyText(sectionLink(section, sub)).then((gave) => {
            if (!gave) return;

            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
        className={cn(
          "shrink-0 rounded p-1 text-ink-faint opacity-0 transition",
          "hover:bg-hover hover:text-ink focus-visible:opacity-100 focus-visible:outline-none",
          "focus-visible:ring-2 focus-visible:ring-foco-anel group-hover/titulo:opacity-100",
          copied && "text-online opacity-100",
        )}
      >
        <Link2 data-gc="configuracoes.botao-de-link.link2" size={15} />
      </button>
    </Tooltip>
  );
};
