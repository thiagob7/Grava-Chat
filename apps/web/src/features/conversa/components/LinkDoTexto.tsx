import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { houseAddress, themeLinkId } from "@gravae/shared";

import { useImportTheme } from "~/features/tema/stores/importar-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";
import { houseOrigins } from "~/lib/origens";
import { LinkPreview } from "~/features/conversa/components/PreviaDoLink";
import { Tooltip } from "~/components/ui/tooltip";

export const TextLink: React.FC<{ url: string }> = ({ url }) => {
  const navigate = useNavigate();
  const openTheme = useImportTheme((s) => s.open);

  const our = useMemo(() => houseOrigins(), []);
  const address = houseAddress(url, our);
  const fromHouse = address !== null;
  const [peeking, setPeeking] = useState(false);

  const link = (
    <a data-gc="conversa.link-do-texto.a"
      href={url}
      target={fromHouse ? undefined : "_blank"}
      rel="noreferrer noopener"
      className={cn("text-link hover:underline", flxCls("linkText"))}
      onClick={(event) => {
        if (!address || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;

        event.preventDefault();

        const theme = themeLinkId(url, our);
        if (theme) {
          openTheme(theme);
          return;
        }

        navigate(`${address.pathname}${address.search}${address.hash}`);
      }}
    >
      {url}
    </a>
  );

  if (fromHouse) return link;

  return (
    <Tooltip data-gc="conversa.link-do-texto.tooltip.set-peeking"
      onOpenChange={setPeeking}
      className="px-2.5 py-2.5"
      label={<LinkPreview data-gc="conversa.link-do-texto.link-preview" url={url} active={peeking} />}
    >
      {link}
    </Tooltip>
  );
};
