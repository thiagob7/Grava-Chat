import { useMutation } from "@tanstack/react-query";

import { findVoiceToken } from "~/@core/application/requests/voice/find-voice-token";

/**
 * Mutation e não query: o token dura 10 minutos e é pedido no momento exato de
 * entrar na chamada. Cachear um token de sessão de mídia não faz sentido.
 */
export const useVoiceToken = () =>
  useMutation({
    mutationFn: (channelId: string) => findVoiceToken(channelId),
  });
