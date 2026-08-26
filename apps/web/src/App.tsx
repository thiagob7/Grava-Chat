import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastContainer } from "react-toastify";

import { ConfirmProvider } from "~/components/ui/confirm";
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
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <TooltipProvider>
          <ConfirmProvider>
          <AppRoutes />
          <VoiceAudioSink />
          <SeletorDeTela />
          <VisualizadorDeImagem />
          <ChuvaDeSuperReacao />
          <ToastContainer position="bottom-center" theme="dark" autoClose={4000} hideProgressBar />
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />}
          </ConfirmProvider>
        </TooltipProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
};
