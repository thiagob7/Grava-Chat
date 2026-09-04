import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastContainer } from "react-toastify";

import { ConfirmProvider } from "~/components/ui/confirm";
import { AvisoDeAtualizacao } from "~/features/app/components/AvisoDeAtualizacao";
import { AvisoDeNovoDispositivo } from "~/features/app/components/AvisoDeNovoDispositivo";
import { AvisoDePermissoes } from "~/features/app/components/AvisoDePermissoes";
import { ErrorBoundary } from "~/features/app/components/ErrorBoundary";
import { EstadoDaConexao } from "~/features/app/components/EstadoDaConexao";
import { ChuvaDeSuperReacao } from "~/features/expressao/components/ChuvaDeSuperReacao";
import { SessionProvider } from "~/contexts/session-context";
import { AppRoutes } from "~/routes";
import { VoiceAudioSink } from "~/features/voz/components/VoiceAudioSink";
import { SeletorDeTela } from "~/features/voz/components/SeletorDeTela";
import { VisualizadorDeImagem } from "~/components/VisualizadorDeImagem";
import { useAparenciaAplicada } from "~/features/configuracoes/hooks/use-aparencia";
import { usePushToTalk } from "~/features/voz/hooks/use-push-to-talk";

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
