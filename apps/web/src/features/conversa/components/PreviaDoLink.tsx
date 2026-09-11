import React from "react";

import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import { useTranslation } from "~/traducao";

export const LinkPreview: React.FC<{ url: string; active: boolean }> = ({ url, active }) => {
  const { t } = useTranslation();
  const { data: embed, isLoading } = useEmbed(url, active);

  const destination = (() => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  })();

  return (
    <span data-gc="conversa.previa-do-link.span" className="flex w-60 flex-col gap-1.5 text-left">
      {embed?.image && (
        <img data-gc="conversa.previa-do-link.img"
          src={embed.image}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-28 w-full rounded bg-surface-3 object-cover"
        />
      )}

      {embed?.title && (
        <span data-gc="conversa.previa-do-link.span--2" className="line-clamp-2 text-xs font-semibold leading-snug text-ink">
          {embed.title}
        </span>
      )}

      {embed?.description && (
        <span data-gc="conversa.previa-do-link.span--3" className="line-clamp-3 text-10 leading-snug text-ink-muted">
          {embed.description}
        </span>
      )}

      {!embed && isLoading && (
        <span data-gc="conversa.previa-do-link.span--4" className="text-10 text-ink-faint">
          {t("conversa.previaDoLink.carregando")}
        </span>
      )}

      <span data-gc="conversa.previa-do-link.span--5" className="truncate text-10 text-ink-faint">
        {t("conversa.previaDoLink.destino", { destino: embed?.site ?? destination })}
      </span>
    </span>
  );
};
