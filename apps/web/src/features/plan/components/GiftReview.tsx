import React, { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import { PLAN_NAME, type GiftPreview } from "@gravae/shared";

import { useClaimGift, useStartCardCheck } from "~/@core/application/queries/billing/use-billing";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { LottieArt } from "~/components/LottieArt";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar } from "~/features/perfil/components/Avatar";
import { appearanceFromTheme, stripeOf } from "~/features/plan/lib/stripe-elements";
import { currentLanguage, useTranslation } from "~/traducao";

const loadLoader = () => import("~/assets/animations/loader-success.json").then((mod) => mod.default);

interface ReviewProps {
  code: string;
  gift: GiftPreview;
  onClose: () => void;
}

/*
  A tela de revisar o presente. O total é zero — quem pagou foi quem deu — mas
  pedimos um cartão antes de ativar, e o Stripe confirma esse cartão com o banco
  sem tirar dinheiro. Por isso a tela nasce em dois sabores: com o formulário do
  Stripe em volta, quando a conta ainda não tem cartão, e sem ele quando já tem.
  Os ganchos do Stripe só existem dentro do Elements, e é o que separa os dois.
*/
export const GiftReview: React.FC<ReviewProps> = ({ code, gift, onClose }) => {
  const check = useStartCardCheck();
  const appearance = useMemo(appearanceFromTheme, []);
  const { mutate: askForCheck } = check;

  useEffect(() => {
    if (gift.needsCard) askForCheck();
  }, [gift.needsCard, askForCheck]);

  if (!gift.needsCard) return <PlainReview data-gc="plan.gift-review.plain-review.on-close" code={code} gift={gift} onClose={onClose} />;

  if (!check.data) return <Skeleton data-gc="plan.gift-review.skeleton" className="mt-5 h-64 w-full rounded-lg" />;

  return (
    <Elements data-gc="plan.gift-review.elements"
      stripe={stripeOf(check.data.publishableKey)}
      options={{
        clientSecret: check.data.clientSecret,
        appearance,
        locale: currentLanguage().split("-")[0] as "pt",
      }}
    >
      <CardReview data-gc="plan.gift-review.card-review.on-close" code={code} gift={gift} onClose={onClose} />
    </Elements>
  );
};

const PlainReview: React.FC<ReviewProps> = ({ code, gift, onClose }) => {
  const claim = useClaimGift();

  return (
    <ReviewBody data-gc="plan.gift-review.review-body.on-close"
      gift={gift}
      busy={claim.isPending}
      done={claim.isSuccess}
      onClose={onClose}
      onConfirm={() => claim.mutate({ code })}
    />
  );
};

const CardReview: React.FC<ReviewProps> = ({ code, gift, onClose }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const claim = useClaimGift();
  const [confirming, setConfirming] = useState(false);

  const confirm = async () => {
    if (!stripe || !elements) return;
    setConfirming(true);

    const { error, setupIntent } = await stripe.confirmSetup({ elements, redirect: "if_required" });
    setConfirming(false);

    if (error || !setupIntent) {
      toast.error(error?.message ?? t("configuracoes.subscription.error"));
      return;
    }

    claim.mutate({ code, setupIntentId: setupIntent.id });
  };

  return (
    <ReviewBody data-gc="plan.gift-review.review-body.on-close--2"
      gift={gift}
      busy={confirming || claim.isPending}
      done={claim.isSuccess}
      ready={Boolean(stripe)}
      onClose={onClose}
      onConfirm={() => void confirm()}
      card={<PaymentElement data-gc="plan.gift-review.payment-element" options={{ layout: "tabs" }} />}
    />
  );
};

interface BodyProps {
  gift: GiftPreview;
  busy: boolean;
  done: boolean;
  ready?: boolean;
  card?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

const ReviewBody: React.FC<BodyProps> = ({ gift, busy, done, ready = true, card, onConfirm, onClose }) => {
  const { t } = useTranslation();
  const [agreed, setAgreed] = useState(false);

  const free = new Intl.NumberFormat(currentLanguage(), { style: "currency", currency: "BRL" }).format(0);

  if (done) return <Activated data-gc="plan.gift-review.activated.on-close" onClose={onClose} />;

  if (busy)
    return (
      <div data-gc="plan.gift-review.div" className="py-8 text-center">
        <LottieArt data-gc="plan.gift-review.lottie-art" name="loader-success" load={loadLoader} label={t("configuracoes.subscription.giftActivating")} className="mx-auto w-24" />
        <p data-gc="plan.gift-review.p" className="mt-4 text-sm text-ink-muted">{t("configuracoes.subscription.giftActivating")}</p>
      </div>
    );

  return (
    <form data-gc="plan.gift-review.form"
      className="mt-4 text-left"
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <p data-gc="plan.gift-review.p--2" className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {t("configuracoes.subscription.giftReviewStep")}
      </p>

      <div data-gc="plan.gift-review.div--2" className="mt-2 rounded-lg border border-line-sutil bg-surface-2 px-4 py-3">
        <div data-gc="plan.gift-review.div--3" className="flex items-baseline justify-between gap-3 text-sm font-medium">
          <span data-gc="plan.gift-review.span" className="min-w-0 truncate">
            {PLAN_NAME} {t(gift.interval === "year" ? "configuracoes.subscription.yearly" : "configuracoes.subscription.monthly")}
          </span>
          <span data-gc="plan.gift-review.span--2" className="shrink-0 tabular-nums">{free}</span>
        </div>

        <p data-gc="plan.gift-review.p--3" className="mt-1 text-xs text-ink-muted">{t("configuracoes.subscription.giftClaimDetail", { days: gift.days })}</p>

        <div data-gc="plan.gift-review.div--4" className="mt-3 flex items-baseline justify-between gap-3 border-t border-line-sutil pt-3 text-sm font-semibold">
          <span data-gc="plan.gift-review.span--3">{t("configuracoes.subscription.giftTotalToday")}</span>
          <span data-gc="plan.gift-review.span--4" className="tabular-nums">{free}</span>
        </div>
      </div>

      {gift.from && (
        <p data-gc="plan.gift-review.p--4" className="mt-3 flex items-center gap-2 text-sm text-ink-muted">
          <Avatar data-gc="plan.gift-review.avatar" id={gift.from.id} name={gift.from.displayName} url={gift.from.avatarUrl} size={20} />
          {t("configuracoes.subscription.giftFrom", { name: gift.from.displayName })}
        </p>
      )}

      {card && (
        <div data-gc="plan.gift-review.div--5" className="mt-5">
          {card}
          <p data-gc="plan.gift-review.p--5" className="mt-2 text-xs text-ink-faint">{t("configuracoes.subscription.giftCardWhy")}</p>
        </div>
      )}

      <label data-gc="plan.gift-review.label" className="mt-5 flex items-start gap-2 text-sm text-ink-muted">
        <Checkbox data-gc="plan.gift-review.checkbox" className="mt-0.5" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
        {t("configuracoes.subscription.giftAgree")}
      </label>

      <Button data-gc="plan.gift-review.button" type="submit" className="mt-5 w-full" disabled={!agreed || !ready}>
        {t("configuracoes.subscription.giftActivate")}
      </Button>

      <Button data-gc="plan.gift-review.button.on-close" type="button" variant="ghost" className="mt-2 w-full" onClick={onClose}>
        {t("comum.cancelar")}
      </Button>
    </form>
  );
};

const Activated: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { t } = useTranslation();

  return (
    <div data-gc="plan.gift-review.div--6" className="py-6 text-center">
      <span data-gc="plan.gift-review.span--5" className="inline-flex rounded-md border-2 border-ink px-4 py-2 text-xl font-black uppercase tracking-wide">
        {t("configuracoes.subscription.giftDoneTitle", { plan: PLAN_NAME })}
      </span>

      <p data-gc="plan.gift-review.p--6" className="mt-4 text-sm text-ink-muted">{t("configuracoes.subscription.giftClaimed")}</p>

      <Button data-gc="plan.gift-review.button.on-close--2" className="mt-6 w-full" onClick={onClose}>
        {t("configuracoes.subscription.giftOpenApp")}
      </Button>
    </div>
  );
};
