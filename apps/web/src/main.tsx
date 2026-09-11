import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { registerServiceWorker } from "~/lib/service-worker";
import { applyCursors, useCursors } from "~/features/configuracoes/stores/cursores";
import "~/traducao";

import { App, queryClient } from "~/App";
import { socket } from "~/@core/lib/websocket";
import { getAccessToken } from "~/@core/lib/api";
import { useVoiceStore, voiceTabChannelId } from "~/features/voz/stores/voice-store";
import { useTypingStore } from "~/features/conversa/stores/typing-store";
import "@fontsource-variable/radio-canada-big";
import "@fontsource-variable/radio-canada-big/wght-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "~/styles/index.css";
import "react-toastify/dist/ReactToastify.css";

import { markEnvironmentDesktop } from "~/lib/desktop";
import { followBarColor } from "~/lib/cor-das-barras";

markEnvironmentDesktop();
followBarColor();

if (import.meta.env.DEV) {
  Object.assign(window, {
    __gravae: {
      queryClient,
      cache: (key: string) =>
        queryClient
          .getQueriesData({ queryKey: [key] })
          .map(([key, data]) => ({ key, data })),
      voice: useVoiceStore,
      typing: useTypingStore,
      socket,
      voiceTabChannelId,
      hasAccessToken: () => Boolean(getAccessToken()),
    },
  });
}

registerServiceWorker();
applyCursors(useCursors.getState().cursors);

createRoot(document.getElementById("app")!).render(
  <StrictMode>
    <App data-gc="main.app" />
  </StrictMode>,
);
