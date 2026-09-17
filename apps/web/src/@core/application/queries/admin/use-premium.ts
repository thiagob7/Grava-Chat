import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { findPremiumAccounts, grantPremium, revokePremium } from "~/@core/application/requests/admin/premium";
import { apiErrorMessage } from "~/@core/lib/api";

const PREMIUM = "painel-premium";

export const usePremiumAccounts = (term: string) =>
  useQuery({
    queryKey: [PREMIUM, term],
    queryFn: () => findPremiumAccounts(term || undefined),
    enabled: term === "" || term.length >= 2,
    placeholderData: (previous) => previous,
  });

export const useGrantPremium = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, days }: { userId: string; days: number }) => grantPremium(userId, days),
    onSuccess: () => {
      toast.success("Premium liberado.");
      void client.invalidateQueries({ queryKey: [PREMIUM] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para liberar o premium.")),
  });
};

export const useRevokePremium = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => revokePremium(userId),
    onSuccess: () => {
      toast.success("Premium retirado.");
      void client.invalidateQueries({ queryKey: [PREMIUM] });
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para tirar o premium.")),
  });
};
