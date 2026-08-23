import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App, queryClient } from "~/App";
import { socket } from "~/@core/lib/websocket";
import { getAccessToken } from "~/@core/lib/api";
import { useVoiceStore, voiceTabChannelId } from "~/stores/voice-store";
import { useTypingStore } from "~/stores/typing-store";
/*
  A fonte do app, empacotada. Variável: um arquivo cobre todos os pesos, então
  isto é UM download em vez de quatro.
*/
import "@fontsource-variable/inter";
import "~/styles/index.css";
import "react-toastify/dist/ReactToastify.css";

/**
 * Em desenvolvimento, o estado fica acessível no console
 * (`__gravae.voice.getState()`). Depurar tempo real sem isso é adivinhação —
 * e o cache do React Query já tem o devtools próprio, no canto da tela.
 */
if (import.meta.env.DEV) {
  Object.assign(window, {
    __gravae: {
      queryClient,
      /** Atalho: __gravae.cache("find-many-friends") */
      cache: (chave: string) =>
        queryClient
          .getQueriesData({ queryKey: [chave] })
          .map(([key, data]) => ({ key, data })),
      voice: useVoiceStore,
      typing: useTypingStore,
      socket,
      voiceTabChannelId,
      hasAccessToken: () => Boolean(getAccessToken()),
    },
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
