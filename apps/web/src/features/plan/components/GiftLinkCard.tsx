import React from "react";
import { Infinity as InfinityIcon } from "lucide-react";
import { PLAN_NAME, prettyGiftCode } from "@gravae/shared";

import { usePlanStore } from "~/features/plan/stores/plan-store";
import { Button } from "~/components/ui/button";
import { useTranslation } from "~/traducao";

export const GiftLinkCard: React.FC<{ code: string }> = ({ code }) => {
  const { t } = useTranslation();
  const askClaim = usePlanStore((s) => s.claimGift);

  return (
    <div data-gc="plan.gift-link-card.div" className="mt-1 max-w-md overflow-hidden rounded-xl border border-brand/40 bg-brand/10">
      <div data-gc="plan.gift-link-card.div--2" className="flex items-center gap-3 p-4">
        <span data-gc="plan.gift-link-card.span" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/20 text-brand">
          <InfinityIcon data-gc="plan.gift-link-card.infinity-icon" size={22} />
        </span>

        <div data-gc="plan.gift-link-card.div--3" className="min-w-0 flex-1">
          <p data-gc="plan.gift-link-card.p" className="text-sm font-semibold">{t("configuracoes.subscription.giftLinkTitle", { plan: PLAN_NAME })}</p>
          <p data-gc="plan.gift-link-card.p--2" className="mt-0.5 text-xs text-ink-muted">{t("configuracoes.subscription.giftLinkDetail")}</p>
          <p data-gc="plan.gift-link-card.p--3" className="mt-1 font-mono text-xs tracking-wider text-ink-faint">{prettyGiftCode(code)}</p>
        </div>
      </div>

      <div data-gc="plan.gift-link-card.div--4" className="px-4 pb-4">
        <Button data-gc="plan.gift-link-card.button" size="sm" onClick={() => askClaim(code)}>
          {t("configuracoes.subscription.giftRedeem")}
        </Button>
      </div>
    </div>
  );
};
