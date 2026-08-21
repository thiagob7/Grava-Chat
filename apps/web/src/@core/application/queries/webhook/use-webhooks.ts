import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { findWebhooks } from "~/@core/application/requests/webhook/find-webhooks";
import {
  createWebhook,
  type CreateWebhookDTO,
} from "~/@core/application/requests/webhook/create-webhook";
import {
  updateWebhook,
  type UpdateWebhookDTO,
} from "~/@core/application/requests/webhook/update-webhook";
import {
  deleteWebhook,
  type DeleteWebhookDTO,
} from "~/@core/application/requests/webhook/delete-webhook";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindWebhooks = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.webhook.find_many(guildId ?? ""),
    queryFn: () => findWebhooks(guildId!),
    enabled: Boolean(guildId),
  });

function useInvalidar(guildId: string | undefined) {
  const queryClient = useQueryClient();

  return () => {
    if (guildId) void queryClient.invalidateQueries({ queryKey: queryKeys.webhook.find_many(guildId) });
  };
}

export const useCreateWebhook = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: (data: CreateWebhookDTO) => createWebhook(data),
    onSuccess: () => {
      invalidar();
      toast.success("Webhook criado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao criar o webhook.")),
  });
};

export const useUpdateWebhook = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: (data: UpdateWebhookDTO) => updateWebhook(data),
    onSuccess: () => {
      invalidar();
      toast.success("Webhook salvo.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao salvar o webhook.")),
  });
};

export const useDeleteWebhook = (guildId: string | undefined) => {
  const invalidar = useInvalidar(guildId);

  return useMutation({
    mutationFn: (data: DeleteWebhookDTO) => deleteWebhook(data),
    onSuccess: () => {
      invalidar();
      toast.success("Webhook apagado.");
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Erro ao apagar o webhook.")),
  });
};
