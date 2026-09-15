import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  findBilling,
  openBillingPortal,
  requestRefund,
  startCheckout,
} from "~/@core/application/requests/billing/billing";
import { planOf } from "@gravae/shared";

import { queryKeys } from "~/@core/infra/constants/query-keys";
import { apiErrorMessage } from "~/@core/lib/api";
import { usePlanStore } from "~/features/plan/stores/plan-store";
import { i18next } from "~/traducao";

export const BILLING_KEY = ["find-billing"];

const WAIT_MS = 60_000;

export const useBilling = (enabled = true) => {
  const awaitingSince = usePlanStore((s) => s.awaitingPaymentSince);

  return useQuery({
    queryKey: BILLING_KEY,
    queryFn: findBilling,
    enabled,
    retry: false,
    refetchInterval: (query) => {
      if (!awaitingSince || Date.now() - awaitingSince > WAIT_MS) return false;
      return planOf(query.state.data?.premiumUntil) === "premium" ? false : 3000;
    },
  });
};

const goTo = ({ url }: { url: string }) => window.location.assign(url);

export const useStartCheckout = () =>
  useMutation({
    mutationFn: startCheckout,
    onSuccess: goTo,
    onError: (error) => toast.error(apiErrorMessage(error, i18next.t("configuracoes.subscription.error"))),
  });

export const useOpenBillingPortal = () =>
  useMutation({
    mutationFn: openBillingPortal,
    onSuccess: goTo,
    onError: (error) => toast.error(apiErrorMessage(error, i18next.t("configuracoes.subscription.error"))),
  });

export const useRequestRefund = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: requestRefund,
    onSuccess: (status) => {
      client.setQueryData(BILLING_KEY, status);
      void client.invalidateQueries({ queryKey: [queryKeys.auth.me] });
      toast.success(i18next.t("configuracoes.subscription.refunded"));
    },
    onError: (error) => toast.error(apiErrorMessage(error, i18next.t("configuracoes.subscription.error"))),
  });
};
