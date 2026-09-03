import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

/*
  O i18next é importado ANTES do App.

  Ele se inicializa na importação, e o detector precisa ter escolhido o idioma
  antes do primeiro componente renderizar — senão a primeira pintura sai no
  idioma padrão e troca na segunda, com a tela piscando.
*/
import "~/traducao";

import { App, queryClient } from "~/App";
import { socket } from "~/@core/lib/websocket";
import { getAccessToken } from "~/@core/lib/api";
import { useVoiceStore, voiceTabChannelId } from "~/stores/voice-store";
import { useTypingStore } from "~/stores/typing-store";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource-variable/ibm-plex-sans/wght-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "~/styles/index.css";
import "react-toastify/dist/ReactToastify.css";

import { marcarAmbienteDesktop } from "~/lib/desktop";

/// Antes de renderizar: a classe muda espaçamento, e aplicá-la depois faria
/// o trilho saltar na primeira pintura.
marcarAmbienteDesktop();

if (import.meta.env.DEV) {
  Object.assign(window, {
    __gravae: {
      queryClient,
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
