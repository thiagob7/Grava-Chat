import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  criarEmblema,
  removerEmblema,
  vestirEmblemas,
} from "~/@core/application/requests/guild/emblemas";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * As três operações de emblema compartilham a mesma invalidação: tudo — a
 * definição e quem veste — chega no detalhe do servidor, numa requisição só.
 */
const useEmblemaMutation = <T,>(guildId: string, fn: (v: T) => Promise<unknown>, erro: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guild.find(guildId) });
    },
    onError: (e) => toast.error(apiErrorMessage(e, erro)),
  });
};

export const useCriarEmblema = (guildId: string) =>
  useEmblemaMutation(
    guildId,
    (data: { nome: string; emoji?: string | null; iconUrl?: string | null }) =>
      criarEmblema(guildId, data),
    "Não consegui criar o emblema.",
  );

export const useRemoverEmblema = (guildId: string) =>
  useEmblemaMutation(
    guildId,
    (emblemaId: string) => removerEmblema(guildId, emblemaId),
    "Não consegui apagar o emblema.",
  );

export const useVestirEmblemas = (guildId: string) =>
  useEmblemaMutation(
    guildId,
    (emblemIds: string[]) => vestirEmblemas(guildId, emblemIds),
    "Não consegui salvar seus emblemas.",
  );
