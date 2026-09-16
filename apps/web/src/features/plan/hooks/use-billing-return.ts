import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { BILLING_KEY } from "~/@core/application/queries/billing/use-billing";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { setPremiumRequiredHandler } from "~/@core/lib/api";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { i18next } from "~/traducao";

export const BILLING_RETURN_PARAM = "billing";
export const GIFT_PARAM = "gift";

export function useBillingReturn() {
  const client = useQueryClient();
  const open = useSettings((s) => s.open);
  const awaitPayment = usePlanStore((s) => s.awaitPayment);
  const openUpgrade = usePlanStore((s) => s.openUpgrade);

  useEffect(() => {
    setPremiumRequiredHandler(openUpgrade);
    return () => setPremiumRequiredHandler(null);
  }, [openUpgrade]);

  const setGiftCode = usePlanStore((s) => s.setGiftCode);
  const claimGift = usePlanStore((s) => s.claimGift);

  useEffect(() => {
    const url = new URL(window.location.href);
    const gift = url.searchParams.get(GIFT_PARAM);

    if (gift) {
      url.searchParams.delete(GIFT_PARAM);
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
      claimGift(gift);
    }

    const outcome = url.searchParams.get(BILLING_RETURN_PARAM);
    if (!outcome) return;

    url.searchParams.delete(BILLING_RETURN_PARAM);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);

    if (outcome === "success") {
      awaitPayment();
      void client.invalidateQueries({ queryKey: BILLING_KEY });
      void client.invalidateQueries({ queryKey: [queryKeys.auth.me] });
      toast.success(i18next.t("configuracoes.subscription.success"));
    } else {
      toast.info(i18next.t("configuracoes.subscription.canceled"));
    }

    open("subscription");
  }, [client, open, awaitPayment, setGiftCode, claimGift]);
}
