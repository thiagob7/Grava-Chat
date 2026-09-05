import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  apagarTema,
  findMeusTemas,
  findTema,
  publicarTema,
} from "~/@core/application/requests/tema/temas";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useTema = (temaId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.tema.find(temaId ?? ""),
    queryFn: () => findTema(temaId!),
    enabled: Boolean(temaId),
    retry: false,
  });

export const useMeusTemas = (enabled: boolean) =>
  useQuery({ queryKey: [queryKeys.tema.meus], queryFn: findMeusTemas, enabled });

export const usePublicarTema = () => {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: publicarTema,
    onSuccess: () => void cliente.invalidateQueries({ queryKey: [queryKeys.tema.meus] }),
    onError: (erro) => toast.error(apiErrorMessage(erro, "Não consegui publicar o tema.")),
  });
};

export const useApagarTema = () => {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: apagarTema,
    onSuccess: () => {
      toast.success("Tema apagado. O link parou de valer.");
      void cliente.invalidateQueries({ queryKey: [queryKeys.tema.meus] });
    },
    onError: (erro) => toast.error(apiErrorMessage(erro, "Não consegui apagar o tema.")),
  });
};
