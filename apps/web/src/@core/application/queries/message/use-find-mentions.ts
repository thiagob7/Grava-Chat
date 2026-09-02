import { useQuery } from "@tanstack/react-query";

import { findMentions } from "~/@core/application/requests/message/find-mentions";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/// Só busca quando a caixa está aberta: é uma lista que ninguém olha o tempo
/// todo, e ela custa uma varredura de sete dias no banco.
export const useFindMentions = (ativo: boolean) =>
  useQuery({
    queryKey: [queryKeys.message.mentions],
    queryFn: findMentions,
    enabled: ativo,
    staleTime: 30_000,
  });
