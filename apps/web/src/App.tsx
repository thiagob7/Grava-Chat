import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastContainer } from "react-toastify";

import { ConfirmProvider } from "~/components/ui/confirm";
import { AvisoDeAtualizacao } from "~/components/AvisoDeAtualizacao";
import { AvisoDeNovoDispositivo } from "~/components/AvisoDeNovoDispositivo";
import { AvisoDePermissoes } from "~/components/AvisoDePermissoes";
import { ErrorBoundary } from "~/components/ErrorBoundary";
import { EstadoDaConexao } from "~/components/EstadoDaConexao";
import { ChuvaDeSuperReacao } from "~/components/ChuvaDeSuperReacao";
import { SessionProvider } from "~/contexts/session-context";
import { AppRoutes } from "~/routes";
import { VoiceAudioSink } from "~/components/VoiceAudioSink";
import { SeletorDeTela } from "~/components/SeletorDeTela";
import { VisualizadorDeImagem } from "~/components/VisualizadorDeImagem";
import { useAparenciaAplicada } from "~/hooks/use-aparencia";
import { usePushToTalk } from "~/hooks/use-push-to-talk";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export const App: React.FC = () => {
  usePushToTalk();
  useAparenciaAplicada();

  return (
    /*
      A rede de segurança fica por FORA de tudo, inclusive dos provedores: se
      quem quebrar for um deles, ainda assim aparece uma tela com botão em vez
      de uma janela preta.
    */
    <ErrorBoundary onde="aplicação">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TooltipProvider>
            <ConfirmProvider>
              <AppRoutes />
              <EstadoDaConexao />
              <AvisoDeAtualizacao />
              <AvisoDePermissoes />
              <AvisoDeNovoDispositivo />
              <VoiceAudioSink />
              <SeletorDeTela />
              <VisualizadorDeImagem />
              <ChuvaDeSuperReacao />
              <ToastContainer
                position="bottom-center"
                theme="dark"
                autoClose={4000}
                hideProgressBar
              />
              {import.meta.env.DEV && (
                <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
              )}
            </ConfirmProvider>
          </TooltipProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
