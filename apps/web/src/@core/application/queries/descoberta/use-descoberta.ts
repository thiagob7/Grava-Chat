import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  entrarNaComunidade,
  findAplicativos,
  findComunidades,
  findTemasDaGaleria,
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

export const useTemasDaGaleria = (busca: string) =>
  useQuery({
    queryKey: queryKeys.descoberta.temas(busca),
    queryFn: () => findTemasDaGaleria(busca || undefined),
    placeholderData: keepPreviousData,
  });

export const useAplicativos = (busca: string) =>
  useQuery({
    queryKey: queryKeys.descoberta.aplicativos(busca),
    queryFn: () => findAplicativos(busca || undefined),
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
