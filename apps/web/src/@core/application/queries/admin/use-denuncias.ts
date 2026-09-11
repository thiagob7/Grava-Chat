import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import {
  giveOutcome,
  findReports,
  type Outcome,
} from "~/@core/application/requests/admin/denuncias";
import { apiErrorMessage } from "~/@core/lib/api";

export const useReports = (pending: boolean, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: ["admin-denuncias", pending],
    queryFn: ({ pageParam }) =>
      findReports({ pending: pending || undefined, before: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
    enabled,
  });

export const useGiveOutcome = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: Outcome }) => giveOutcome(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["admin-denuncias"] }),
    onError: (error) => toast.error(apiErrorMessage(error, "Não deu para registrar o desfecho.")),
  });
};
