import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  addBotToGuild,
  createBot,
  deleteBot,
  findBotDestinations,
  findBotGuilds,
  findBotInvite,
  findBots,
  regenerateBotToken,
  removeBotFromGuild,
  updateBot,
  type EditBotInput,
} from "~/@core/application/requests/bot/bots";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useFindBots = (enabled: boolean) =>
  useQuery({ queryKey: [queryKeys.bot.find_many], queryFn: findBots, enabled });

export const useBotInvite = (botId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.bot.invite(botId ?? ""),
    queryFn: () => findBotInvite(botId!),
    enabled: Boolean(botId),
    retry: false,
  });

export const useBotDestinations = (botId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.bot.destinations(botId ?? ""),
    queryFn: () => findBotDestinations(botId!),
    enabled: Boolean(botId),
  });

export const useBotGuilds = (botId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.bot.guilds(botId ?? ""),
    queryFn: () => findBotGuilds(botId!),
    enabled: Boolean(botId),
  });

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: [queryKeys.bot.find_many] });
}

const error = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

export const useCreateBot = () => {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: createBot,
    onSuccess: invalidate,
    onError: error("Não deu pra criar o bot."),
  });
};

export const useUpdateBot = () => {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({ botId, data }: { botId: string; data: EditBotInput }) =>
      updateBot(botId, data),
    onSuccess: () => {
      invalidate();
      toast.success("Bot atualizado.");
    },
    onError: error("Não deu pra salvar."),
  });
};

export const useRegenerateBotToken = () => {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: regenerateBotToken,
    onSuccess: () => {
      invalidate();
      toast.success("Token novo gerado. O antigo parou de valer agora.");
    },
    onError: error("Não deu pra gerar outro token."),
  });
};

export const useDeleteBot = () => {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: deleteBot,
    onSuccess: () => {
      invalidate();
      toast.success("Bot apagado.");
    },
    onError: error("Não deu pra apagar o bot."),
  });
};

export const useAddBotToGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ botId, guildId }: { botId: string; guildId: string }) =>
      addBotToGuild(botId, guildId),

    onSuccess: (_, { botId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bot.guilds(botId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.bot.destinations(botId) });
      void queryClient.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
    },

    onError: error("Não deu pra adicionar o bot."),
  });
};

export const useRemoveBotFromGuild = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ botId, guildId }: { botId: string; guildId: string }) =>
      removeBotFromGuild(botId, guildId),

    onSuccess: (_, { botId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.bot.guilds(botId) });
      toast.success("Bot removido do servidor.");
    },

    onError: error("Não deu pra remover o bot."),
  });
};
