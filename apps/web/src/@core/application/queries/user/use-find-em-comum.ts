import { useQuery } from "@tanstack/react-query";

import { findEmComum } from "~/@core/application/requests/user/find-em-comum";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * Amigos e servidores em comum — as listas, não a contagem.
 *
 * Só sai da toca quando a aba é aberta (`enabled`): o cartão já mostra quantos
 * são com o que veio do perfil, e a maioria das pessoas nunca clica.
 */
export const useFindEmComum = (userId: string | null, ativo: boolean) =>
  useQuery({
    queryKey: queryKeys.user.emComum(userId ?? ""),
    queryFn: () => findEmComum(userId!),
    enabled: Boolean(userId) && ativo,
    staleTime: 60_000,
  });
