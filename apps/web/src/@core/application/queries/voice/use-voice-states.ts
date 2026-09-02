import { useQuery } from "@tanstack/react-query";

import { findVoiceStates } from "~/@core/application/requests/voice/find-voice-states";
import { queryKeys } from "~/@core/infra/constants/query-keys";

/*
  Quem está em chamada em cada servidor, para a dica do trilho.

  Recarrega sozinha de tempos em tempos porque entrar e sair de voz não passa
  por aqui: os eventos do gateway atualizam o servidor ABERTO, e esta lista é
  justamente sobre os que não estão. Meio minuto é o intervalo em que uma
  informação assim ainda vale — e o custo é uma consulta ao Redis por chamada.
*/
export const useVoiceStates = (enabled: boolean) =>
  useQuery({
    queryKey: [queryKeys.voice.states],
    queryFn: findVoiceStates,
    enabled,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
