import React from "react";
import { LIMITS, type Badge } from "@gravae/shared";
import { toast } from "react-toastify";

import { useWearBadges } from "~/@core/application/queries/guild/use-emblemas";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface PickBadgesProps {
  guildId: string;
  available: Badge[];
  worn: Badge[];
}

export const PickBadges: React.FC<PickBadgesProps> = ({
  guildId,
  available,
  worn,
}) => {
  const { t } = useTranslation();
  const wear = useWearBadges(guildId);
  if (!available.length) return null;

  const current = new Set(worn.map((e) => e.id));

  const toggle = (id: string) => {
    const next = new Set(current);

    if (next.has(id)) next.delete(id);
    else if (next.size >= LIMITS.badgesByMember) {
      return toast.info(t("perfil.emblemas.limite", { quantidade: LIMITS.badgesByMember }));
    } else next.add(id);

    wear.mutate([...next]);
  };

  return (
    <div data-gc="perfil.cartao.escolher-emblemas.div" className="mt-3">
      <p data-gc="perfil.cartao.escolher-emblemas.p" className="mb-1.5 text-xs font-semibold uppercase text-ink-faint">
        {t("perfil.emblemas.doServidor")}
      </p>

      <div data-gc="perfil.cartao.escolher-emblemas.div--2" className="flex flex-wrap gap-1.5">
        {available.map((badge) => (
          <button data-gc="perfil.cartao.escolher-emblemas.button"
            key={badge.id}
            onClick={() => toggle(badge.id)}
            title={badge.name}
            disabled={wear.isPending}
            className={cn(
              "flex items-center gap-1.5 rounded border px-2 py-1 text-xs transition",
              current.has(badge.id)
                ? "border-brand bg-surface-3 text-ink"
                : "border-line bg-surface-0 text-ink-muted hover:bg-surface-3 hover:text-ink",
            )}
          >
            {badge.emoji ? (
              <span data-gc="perfil.cartao.escolher-emblemas.span" className="leading-none">{badge.emoji}</span>
            ) : badge.iconUrl ? (
              <img data-gc="perfil.cartao.escolher-emblemas.img" src={badge.iconUrl} alt="" className="size-4 object-contain" />
            ) : null}
            {badge.name}
          </button>
        ))}
      </div>
    </div>
  );
};
