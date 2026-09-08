import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  darDesfecho,
  findDenuncias,
  type Desfecho,
} from "~/@core/application/requests/admin/denuncias";
import { apiErrorMessage } from "~/@core/lib/api";

export const useDenuncias = (pendentes: boolean, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ["admin-denuncias", pendentes],
    queryFn: ({ pageParam }) =>
      findDenuncias({ pendentes: pendentes || undefined, antesDe: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (ultima) => ultima.proxima ?? undefined,
    enabled,
  });

export const useDarDesfecho = () => {
  const cliente = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decisao }: { id: string; decisao: Desfecho }) => darDesfecho(id, decisao),
    onSuccess: () => void cliente.invalidateQueries({ queryKey: ["admin-denuncias"] }),
    onError: (erro) => toast.error(apiErrorMessage(erro, "Não deu para registrar o desfecho.")),
  });
};
