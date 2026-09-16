import React from "react";
import { PLAN_NAME, prettyGiftCode } from "@gravae/shared";

import { Button } from "~/components/ui/button";
import { InfinityArt } from "~/features/plan/components/InfinityArt";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { useTranslation } from "~/traducao";

export const GiftLinkCard: React.FC<{ code: string }> = ({ code }) => {
  const { t } = useTranslation();
  const askClaim = usePlanStore((s) => s.claimGift);

  return (
    <div data-gc="plan.gift-link-card.div" className="mt-1 flex max-w-lg overflow-hidden rounded-xl border border-brand/40 bg-surface-1">
      <div data-gc="plan.gift-link-card.div--2" className="min-w-0 flex-1 p-4">
        <p data-gc="plan.gift-link-card.p" className="text-sm font-semibold">{t("configuracoes.subscription.giftLinkTitle", { plan: PLAN_NAME })}</p>
        <p data-gc="plan.gift-link-card.p--2" className="mt-1 text-xs text-ink-muted">{t("configuracoes.subscription.giftLinkDetail")}</p>
        <p data-gc="plan.gift-link-card.p--3" className="mt-2 font-mono text-xs tracking-wider text-ink-faint">{prettyGiftCode(code)}</p>

        <Button data-gc="plan.gift-link-card.button" size="sm" className="mt-3" onClick={() => askClaim(code)}>
          {t("configuracoes.subscription.giftRedeem")}
        </Button>
      </div>

      <div data-gc="plan.gift-link-card.div--3" className="relative hidden w-44 shrink-0 overflow-hidden bg-gradient-to-br from-brand/45 via-brand/20 to-mencao/35 @sm:block">
        <span data-gc="plan.gift-link-card.span" aria-hidden className="infinity-blob absolute -right-10 -top-8 size-32 rounded-full bg-brand/40 blur-2xl" />
        <InfinityArt data-gc="plan.gift-link-card.infinity-art" className="absolute inset-0 m-auto size-32" />
      </div>
    </div>
  );
};
