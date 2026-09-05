import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  entrarNaComunidade,
  findComunidades,
  type FiltroDeDescoberta,
} from "~/@core/application/requests/descoberta/descoberta";
import { apiErrorMessage } from "~/@core/lib/api";
import { queryKeys } from "~/@core/infra/constants/query-keys";

export const useComunidades = (filtro: FiltroDeDescoberta) =>
  useQuery({
    queryKey: queryKeys.descoberta.comunidades(filtro.categoria ?? "", filtro.busca ?? ""),
    queryFn: () => findComunidades(filtro),
    placeholderData: keepPreviousData,
  });

export const useEntrarNaComunidade = () => {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: entrarNaComunidade,
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: [queryKeys.guild.find_many] });
      void cliente.invalidateQueries({ queryKey: ["descobrir-comunidades"] });
    },
    onError: (erro) => toast.error(apiErrorMessage(erro)),
  });
};
