import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import type { CardIntent } from "@gravae/shared";

import { BILLING_KEY, GIFTS_KEY } from "~/@core/application/queries/billing/use-billing";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { Button } from "~/components/ui/button";
import { appearanceFromTheme, stripeOf } from "~/features/plan/lib/stripe-elements";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { currentLanguage, useTranslation } from "~/traducao";

export const CardPayment: React.FC<{ intent: CardIntent; publishableKey: string; onPaid: () => void }> = ({
  intent,
  publishableKey,
  onPaid,
}) => {
  const appearance = useMemo(appearanceFromTheme, []);

  return (
    <Elements data-gc="plan.card-payment.elements"
      stripe={stripeOf(publishableKey)}
      options={{ clientSecret: intent.clientSecret, appearance, locale: currentLanguage().split("-")[0] as "pt" }}
    >
      <CardForm data-gc="plan.card-payment.card-form.on-paid" intent={intent} onPaid={onPaid} />
    </Elements>
  );
};

const CardForm: React.FC<{ intent: CardIntent; onPaid: () => void }> = ({ intent, onPaid }) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const client = useQueryClient();
  const awaitPayment = usePlanStore((s) => s.awaitPayment);
  const [paying, setPaying] = useState(false);

  const amount = new Intl.NumberFormat(currentLanguage(), {
    style: "currency",
    currency: intent.currency.toUpperCase(),
  }).format(intent.amount / 100);

  const pay = async () => {
    if (!stripe || !elements) return;
    setPaying(true);

    const { error } = await stripe.confirmPayment({ elements, redirect: "if_required" });
    setPaying(false);

    if (error) {
      toast.error(error.message ?? t("configuracoes.subscription.error"));
      return;
    }

    awaitPayment();
    void client.invalidateQueries({ queryKey: BILLING_KEY });
    void client.invalidateQueries({ queryKey: GIFTS_KEY });
    void client.invalidateQueries({ queryKey: [queryKeys.auth.me] });
    toast.success(t("configuracoes.subscription.cardPaid"));
    onPaid();
  };

  return (
    <form data-gc="plan.card-payment.form"
      className="mt-6"
      onSubmit={(event) => {
        event.preventDefault();
        void pay();
      }}
    >
      <PaymentElement data-gc="plan.card-payment.payment-element" options={{ layout: "tabs" }} />

      <Button data-gc="plan.card-payment.button" type="submit" className="mt-5 w-full" loading={paying} disabled={!stripe}>
        {t("configuracoes.subscription.payAmount", { amount })}
      </Button>

      <p data-gc="plan.card-payment.p" className="mt-3 text-center text-xs text-ink-faint">{t("configuracoes.subscription.legal")}</p>
    </form>
  );
};
