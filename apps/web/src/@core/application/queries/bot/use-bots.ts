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
  type EditarBotInput,
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

function useInvalidar() {
  const queryClient = useQueryClient();
  return () => void queryClient.invalidateQueries({ queryKey: [queryKeys.bot.find_many] });
}

const erro = (fallback: string) => (e: unknown) => toast.error(apiErrorMessage(e, fallback));

export const useCreateBot = () => {
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: createBot,
    onSuccess: invalidar,
    onError: erro("Não deu pra criar o bot."),
  });
};

export const useUpdateBot = () => {
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: ({ botId, dados }: { botId: string; dados: EditarBotInput }) =>
      updateBot(botId, dados),
    onSuccess: () => {
      invalidar();
      toast.success("Bot atualizado.");
    },
    onError: erro("Não deu pra salvar."),
  });
};

export const useRegenerateBotToken = () => {
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: regenerateBotToken,
    onSuccess: () => {
      invalidar();
      toast.success("Token novo gerado. O antigo parou de valer agora.");
    },
    onError: erro("Não deu pra gerar outro token."),
  });
};

export const useDeleteBot = () => {
  const invalidar = useInvalidar();

  return useMutation({
    mutationFn: deleteBot,
    onSuccess: () => {
      invalidar();
      toast.success("Bot apagado.");
    },
    onError: erro("Não deu pra apagar o bot."),
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

    onError: erro("Não deu pra adicionar o bot."),
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

    onError: erro("Não deu pra remover o bot."),
  });
};
