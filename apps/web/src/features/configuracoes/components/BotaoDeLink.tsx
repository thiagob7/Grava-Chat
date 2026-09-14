import React, { useState } from "react";
import { Link2 } from "lucide-react";

import { IconButton } from "~/components/ui/button";
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
      <IconButton data-gc="configuracoes.botao-de-link.icon-button"
        size="xs"
        label={`Copiar link para ${oQue}`}
        onClick={() => {
          void copyText(sectionLink(section, sub)).then((gave) => {
            if (!gave) return;

            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          });
        }}
        className={cn(
          "rounded text-ink-faint opacity-0 [&_svg]:size-[15px]",
          "focus-visible:opacity-100 group-hover/titulo:opacity-100",
          copied && "text-online opacity-100",
        )}
      >
        <Link2 data-gc="configuracoes.botao-de-link.link2" />
      </IconButton>
    </Tooltip>
  );
};
