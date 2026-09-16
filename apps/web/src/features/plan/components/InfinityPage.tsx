import React, { useRef } from "react";
import { Check, Gift, Infinity as InfinityIcon, Menu } from "lucide-react";
import { PASS_PRICE_CENTS, PLAN_LIMITS, PLAN_NAME, planOf, type BillingInterval, type PlanLimits } from "@gravae/shared";

import { useBilling } from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { ComparisonTable } from "~/features/plan/components/UpgradeModal";
import { LottieArt } from "~/components/LottieArt";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { cn } from "~/lib/utils";
import { currentLanguage, useTranslation } from "~/traducao";

const INTERVALS: BillingInterval[] = ["month", "year"];

const loadHero = () => import("~/assets/lottie/infinity-hero.json").then((mod) => mod.default);

const SECTIONS = [
  { id: "inicio", key: "configuracoes.subscription.pageStart" },
  { id: "planos", key: "configuracoes.subscription.pagePlans" },
  { id: "comparar", key: "configuracoes.subscription.pageCompare" },
] as const;

export const InfinityPage: React.FC<{ onOpenMenu?: () => void }> = ({ onOpenMenu }) => {
  const { t } = useTranslation();
  const billing = useBilling();
  const openUpgrade = usePlanStore((s) => s.openUpgrade);
  const scroller = useRef<HTMLElement>(null);

  const status = billing.data;
  const premium = planOf(status?.premiumUntil) === "premium";

  const money = (cents: number, currency = "brl") =>
    new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);

  const priceOf = (interval: BillingInterval) =>
    status?.prices?.automatic[interval] ?? status?.prices?.none[interval] ?? { amount: PASS_PRICE_CENTS[interval], currency: "brl" };

  const perks: { name: string; value: (limits: PlanLimits) => string }[] = [
    { name: t("configuracoes.subscription.messageRow"), value: (l) => `${l.messageLength}` },
    { name: t("configuracoes.subscription.attachmentRow"), value: (l) => `${Math.round(l.attachmentBytes / (1024 * 1024))} MB` },
    { name: t("configuracoes.subscription.communitiesRow"), value: (l) => `${l.communities}` },
    { name: t("configuracoes.subscription.savedRow"), value: (l) => `${l.savedMessages}` },
    { name: t("configuracoes.subscription.screenRow"), value: (l) => `${l.screenResolutions.at(-1)}p · ${l.screenFrameRates.at(-1)} fps` },
    { name: t("configuracoes.subscription.guildProfilesRow"), value: () => "" },
    { name: t("configuracoes.subscription.expressionsRow"), value: () => "" },
    { name: t("configuracoes.subscription.colorsRow"), value: () => "" },
  ];

  const goTo = (id: string) => document.getElementById(`infinity-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <main data-gc="plan.infinity-page.main" ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto bg-surface-2">
      <header data-gc="plan.infinity-page.header" className="sticky top-0 z-10 flex h-[var(--layout-header-height)] items-center gap-3 border-b border-divisor bg-surface-2/85 px-4 backdrop-blur">
        {onOpenMenu && (
          <button data-gc="plan.infinity-page.button.on-open-menu" type="button" onClick={onOpenMenu} aria-label={t("comum.voltar")} className="text-ink-muted @md:hidden">
            <Menu data-gc="plan.infinity-page.menu" size={18} />
          </button>
        )}

        <span data-gc="plan.infinity-page.span" className="flex items-center gap-2 font-semibold">
          <InfinityIcon data-gc="plan.infinity-page.infinity-icon" size={18} className="text-brand" /> {PLAN_NAME}
        </span>

        <nav data-gc="plan.infinity-page.nav" className="ml-2 hidden items-center gap-1 @md:flex">
          {SECTIONS.map((section) => (
            <button data-gc="plan.infinity-page.button"
              key={section.id}
              type="button"
              onClick={() => goTo(section.id)}
              className="rounded px-2.5 py-1.5 text-sm text-ink-muted transition hover:bg-hover hover:text-ink"
            >
              {t(section.key)}
            </button>
          ))}
        </nav>

        <Button data-gc="plan.infinity-page.button.open-upgrade" size="sm" variant="surface" className="ml-auto" onClick={openUpgrade}>
          <Gift data-gc="plan.infinity-page.gift" size={15} /> {t("configuracoes.subscription.buyGift")}
        </Button>
      </header>

      <section data-gc="plan.infinity-page.section" id="infinity-inicio" className="relative overflow-hidden px-6 pb-16 pt-20 text-center">
        <div data-gc="plan.infinity-page.div" aria-hidden className="pointer-events-none absolute inset-0 infinity-glow" />

        <div data-gc="plan.infinity-page.div--2" className="relative mx-auto max-w-3xl">
          <LottieArt data-gc="plan.infinity-page.lottie-art" name="infinity-hero" load={loadHero} label={PLAN_NAME} className="mx-auto w-48" />

          <h1 data-gc="plan.infinity-page.h1"
            className="mt-6 text-balance text-5xl font-black uppercase leading-[0.95] tracking-tight text-ink drop-shadow-[0_2px_18px_rgb(0_0_0/0.35)] @md:text-6xl"
          >
            {t("configuracoes.subscription.pageTitle", { plan: PLAN_NAME })}
          </h1>

          <p data-gc="plan.infinity-page.p" className="mx-auto mt-5 max-w-lg text-balance text-sm text-ink-muted @md:text-base">
            {t("configuracoes.subscription.upgradeSubtitle")}
          </p>

          {premium && status?.premiumUntil ? (
            <p data-gc="plan.infinity-page.p--2" className="mt-8 inline-flex rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-medium text-brand">
              {t("configuracoes.subscription.activeUntil", {
                date: new Date(status.premiumUntil).toLocaleDateString(currentLanguage(), { dateStyle: "long" }),
              })}
            </p>
          ) : (
            <div data-gc="plan.infinity-page.div--3" className="mt-9 flex flex-wrap items-center justify-center gap-2">
              <Button data-gc="plan.infinity-page.button.open-upgrade--2" size="lg" onClick={openUpgrade}>
                <InfinityIcon data-gc="plan.infinity-page.infinity-icon--2" size={17} /> {t("configuracoes.subscription.subscribe")}
              </Button>
              <Button data-gc="plan.infinity-page.button.open-upgrade--3" size="lg" variant="surface" onClick={openUpgrade}>
                <Gift data-gc="plan.infinity-page.gift--2" size={17} /> {t("configuracoes.subscription.buyGift")}
              </Button>
            </div>
          )}

          <p data-gc="plan.infinity-page.p--3" className="mt-4 text-xs text-ink-faint">{t("configuracoes.subscription.legal")}</p>
        </div>
      </section>

      <div data-gc="plan.infinity-page.div--4" className="mx-auto w-full max-w-3xl px-6 pb-20">
        <section data-gc="plan.infinity-page.section--2" id="infinity-planos" className="scroll-mt-16">
          <h2 data-gc="plan.infinity-page.h2" className="mb-3 text-center text-sm font-semibold uppercase tracking-widest text-ink-faint">
            {t("configuracoes.subscription.pagePlans")}
          </h2>

          <div data-gc="plan.infinity-page.div--5" className="grid gap-3 sm:grid-cols-2">
            {INTERVALS.map((interval) => {
              const price = priceOf(interval);
              const yearly = interval === "year";

              return (
                <button data-gc="plan.infinity-page.button.open-upgrade--4"
                  key={interval}
                  type="button"
                  onClick={openUpgrade}
                  className={cn(
                    "relative rounded-2xl border px-5 py-7 text-center transition",
                    yearly ? "border-brand/60 bg-brand/10 hover:bg-brand/15" : "border-line bg-surface-1 hover:border-brand/40",
                  )}
                >
                  <p data-gc="plan.infinity-page.p--4" className="text-sm font-semibold">
                    {t(yearly ? "configuracoes.subscription.yearly" : "configuracoes.subscription.monthly")}
                  </p>
                  <p data-gc="plan.infinity-page.p--5" className="mt-1 text-3xl font-bold tabular-nums">{money(price.amount, price.currency)}</p>
                  <p data-gc="plan.infinity-page.p--6" className="text-xs text-ink-faint">
                    {t(yearly ? "configuracoes.subscription.perYear" : "configuracoes.subscription.perMonth")}
                  </p>
                </button>
              );
            })}
          </div>

          <ul data-gc="plan.infinity-page.ul" className="mt-6 grid gap-2 sm:grid-cols-2">
            {perks.map((perk) => (
              <li data-gc="plan.infinity-page.li" key={perk.name} className="flex items-center gap-2 rounded-xl border border-line-sutil bg-surface-1 px-3 py-3 text-sm">
                <Check data-gc="plan.infinity-page.check" size={16} className="shrink-0 text-brand" />
                <span data-gc="plan.infinity-page.span--2" className="min-w-0 flex-1 truncate">{perk.name}</span>
                {perk.value(PLAN_LIMITS.premium) && (
                  <span data-gc="plan.infinity-page.span--3" className="shrink-0 text-xs font-semibold text-brand">{perk.value(PLAN_LIMITS.premium)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section data-gc="plan.infinity-page.section--3" id="infinity-comparar" className="scroll-mt-16">
          <ComparisonTable data-gc="plan.infinity-page.comparison-table" />
        </section>
      </div>
    </main>
  );
};
