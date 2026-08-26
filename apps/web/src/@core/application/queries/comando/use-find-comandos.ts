import { useQuery } from "@tanstack/react-query";

import { findComandos } from "~/@core/application/requests/comando/find-comandos";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * A lista fica em cache até alguém mexer nela.
 *
 * Bot entrando, saindo ou registrando outra coisa dispara `commands:changed`,
 * e é o `use-realtime` que invalida. Recarregar por tempo não adiantaria: a
 * lista passa dias igual e muda de uma vez.
 */
export const useFindComandos = (guildId: string | undefined) =>
  useQuery({
    queryKey: queryKeys.comando.find_many(guildId ?? ""),
    queryFn: () => findComandos(guildId!),
    enabled: Boolean(guildId),
    staleTime: Infinity,
  });
