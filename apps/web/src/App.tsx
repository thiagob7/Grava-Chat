import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastContainer } from "react-toastify";

import { ConfirmProvider } from "~/components/ui/confirm";
import { SessionProvider } from "~/contexts/session-context";
import { AppRoutes } from "~/routes";
import { VoiceAudioSink } from "~/components/VoiceAudioSink";
import { SeletorDeTela } from "~/components/SeletorDeTela";
import { VisualizadorDeImagem } from "~/components/VisualizadorDeImagem";
import { usePushToTalk } from "~/hooks/use-push-to-talk";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      /**
       * Nada aqui é atualizado por polling: o que muda chega por WebSocket e é
       * escrito direto no cache (ver use-realtime). Um staleTime baixo faria
       * refetch cego por cima de dados que já estão corretos.
       */
      staleTime: 30_000,
    },
  },
});

export const App: React.FC = () => {
  // A tecla do push-to-talk vale em qualquer tela, não só na do canal de voz.
  usePushToTalk();

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>
          {/* Envolve tudo: a confirmação de exclusão é chamada de dentro de menus
              suspensos, que desmontam o gatilho ao abrir o diálogo. */}
          <ConfirmProvider>
          <AppRoutes />
          {/* Fora das rotas de propósito: navegar entre canais não pode cortar o
              áudio de uma chamada em andamento. */}
          <VoiceAudioSink />
          {/* Só aparece no aplicativo de desktop: no navegador quem desenha o
              seletor de tela é o próprio Chrome. */}
          <SeletorDeTela />
          {/* Fora das rotas: a imagem aberta continua aberta se algo navegar. */}
          <VisualizadorDeImagem />
          <ToastContainer position="bottom-center" theme="dark" autoClose={4000} hideProgressBar />
          {/* Só em desenvolvimento: mostra o que há em cada query key, o que está
              stale e o que o socket acabou de escrever no cache. */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />}
          </ConfirmProvider>
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};
