import { useQuery } from "@tanstack/react-query";

import { findEmbed } from "~/@core/application/requests/embed/embeds";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/**
 * O cartão de um link.
 *
 * A chave é a própria URL: o mesmo link colado em cinco canais é uma busca
 * só, e rolar a conversa para cima e para baixo não repete nenhuma. Quem
 * falhou não tenta de novo — link quebrado continua quebrado, e a mensagem
 * fica com o endereço cru, que é o que sempre foi.
 */
export function useEmbed(url: string) {
  return useQuery({
    queryKey: queryKeys.embed.link(url),
    queryFn: () => findEmbed(url),
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
    retry: false,
  });
}
