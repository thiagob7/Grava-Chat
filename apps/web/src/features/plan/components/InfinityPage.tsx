import React from "react";
import { Check, Gift, Infinity as InfinityIcon } from "lucide-react";
import { PASS_PRICE_CENTS, PLAN_NAME, planOf, type BillingInterval } from "@gravae/shared";

import { useBilling } from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { ComparisonTable } from "~/features/plan/components/UpgradeModal";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { cn } from "~/lib/utils";
import { currentLanguage, useTranslation } from "~/traducao";

const INTERVALS: BillingInterval[] = ["month", "year"];

export const InfinityPage: React.FC<{ onOpenMenu?: () => void }> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  const billing = useBilling();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  const status = billing.data;
  const premium = planOf(status?.premiumUntil) === "premium";

  const money = (cents: number, currency = "brl") =>
    new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

  const priceOf = (interval: BillingInterval) =>
    status?.prices?.automatic[interval] ?? status?.prices?.none[interval] ?? { amount: PASS_PRICE_CENTS[interval], currency: "brl" };

  const perks = [
    t("configuracoes.subscription.messageRow"),
    t("configuracoes.subscription.attachmentRow"),
    t("configuracoes.subscription.guildProfilesRow"),
    t("configuracoes.subscription.expressionsRow"),
    t("configuracoes.subscription.screenRow"),
    t("configuracoes.subscription.badgeRow"),
  ];

  return (
    <main data-gc="plan.infinity-page.main" className="min-h-0 flex-1 overflow-y-auto bg-surface-2">
      {onOpenMenu && (
        <button data-gc="plan.infinity-page.button.on-open-menu" type="button" onClick={onOpenMenu} className="p-3 text-sm text-ink-muted @md:hidden">
          {t("comum.voltar")}
        </button>
      )}

      <section data-gc="plan.infinity-page.section" className="relative overflow-hidden px-6 py-14 text-center">
        <div data-gc="plan.infinity-page.div" aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-b from-brand/25 via-brand/5 to-transparent" />

        <div data-gc="plan.infinity-page.div--2" className="relative mx-auto max-w-2xl">
          <span data-gc="plan.infinity-page.span" className="mx-auto flex size-16 items-center justify-center rounded-3xl bg-brand/20 text-brand">
            <InfinityIcon data-gc="plan.infinity-page.infinity-icon" size={34} />
          </span>

          <h1 data-gc="plan.infinity-page.h1" className="mt-5 text-balance text-4xl font-black uppercase tracking-tight">
            {t("configuracoes.subscription.pageTitle", { plan: PLAN_NAME })}
          </h1>
          <p data-gc="plan.infinity-page.p" className="mx-auto mt-3 max-w-md text-balance text-sm text-ink-muted">
            {t("configuracoes.subscription.upgradeSubtitle")}
          </p>

          {premium && status?.premiumUntil ? (
            <p data-gc="plan.infinity-page.p--2" className="mt-6 text-sm font-medium text-brand">
              {t("configuracoes.subscription.activeUntil", {
                date: new Date(status.premiumUntil).toLocaleDateString(currentLanguage(), { dateStyle: "long" }),
              })}
            </p>
          ) : (
            <div data-gc="plan.infinity-page.div--3" className="mt-7 flex flex-wrap items-center justify-center gap-2">
              <Button data-gc="plan.infinity-page.button.open-upgrade" onClick={openUpgrade}>
                <InfinityIcon data-gc="plan.infinity-page.infinity-icon--2" size={16} /> {t("configuracoes.subscription.subscribe")}
              </Button>
              <Button data-gc="plan.infinity-page.button.open-upgrade--2" variant="surface" onClick={openUpgrade}>
                <Gift data-gc="plan.infinity-page.gift" size={16} /> {t("configuracoes.subscription.buyGift")}
              </Button>
            </div>
          )}
        </div>
      </section>

      <div data-gc="plan.infinity-page.div--4" className="mx-auto w-full max-w-3xl px-6 pb-16">
        <div data-gc="plan.infinity-page.div--5" className="grid gap-3 sm:grid-cols-2">
          {INTERVALS.map((interval) => {
            const price = priceOf(interval);

            return (
              <button data-gc="plan.infinity-page.button.open-upgrade--3"
                key={interval}
                type="button"
                onClick={openUpgrade}
                className={cn(
                  "rounded-xl border border-line bg-surface-1 px-5 py-6 text-center transition hover:border-brand/60 hover:bg-brand/5",
                )}
              >
                <p data-gc="plan.infinity-page.p--3" className="text-sm font-semibold">
                  {t(interval === "month" ? "configuracoes.subscription.monthly" : "configuracoes.subscription.yearly")}
                </p>
                <p data-gc="plan.infinity-page.p--4" className="mt-1 text-3xl font-bold tabular-nums">{money(price.amount, price.currency)}</p>
                <p data-gc="plan.infinity-page.p--5" className="text-xs text-ink-faint">
                  {t(interval === "month" ? "configuracoes.subscription.perMonth" : "configuracoes.subscription.perYear")}
                </p>
              </button>
            );
          })}
        </div>

        <ul data-gc="plan.infinity-page.ul" className="mt-8 grid gap-2 sm:grid-cols-2">
          {perks.map((perk) => (
            <li data-gc="plan.infinity-page.li" key={perk} className="flex items-center gap-2 rounded-lg bg-surface-1 px-3 py-2.5 text-sm">
              <Check data-gc="plan.infinity-page.check" size={16} className="shrink-0 text-brand" /> {perk}
            </li>
          ))}
        </ul>

        <ComparisonTable data-gc="plan.infinity-page.comparison-table" />
      </div>
    </main>
  );
};
