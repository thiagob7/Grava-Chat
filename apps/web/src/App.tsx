import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ToastContainer } from "react-toastify";

import { ConfirmProvider } from "~/components/ui/confirm";
import { PointerEffects } from "~/features/app/components/EfeitosDoPonteiro";
import { UpdateNotice } from "~/features/app/components/AvisoDeAtualizacao";
import { ImportThemeModal } from "~/features/tema/components/ModalDeImportarTema";
import { NewDeviceNotice } from "~/features/app/components/AvisoDeNovoDispositivo";
import { PermissionsNotice } from "~/features/app/components/AvisoDePermissoes";
import { ErrorBoundary } from "~/features/app/components/ErrorBoundary";
import { ConnectionState } from "~/features/app/components/EstadoDaConexao";
import { SuperReactionRain } from "~/features/expressao/components/ChuvaDeSuperReacao";
import { SessionProvider } from "~/contexts/session-context";
import { AppRoutes } from "~/routes";
import { VoiceAudioSink } from "~/features/voz/components/VoiceAudioSink";
import { ScreenPicker } from "~/features/voz/components/SeletorDeTela";
import { ImageViewer } from "~/components/VisualizadorDeImagem";
import { useAppearanceApplied } from "~/features/configuracoes/hooks/use-aparencia";
import { usePushToTalk } from "~/features/voz/hooks/use-push-to-talk";
import { flxCls } from "~/lib/compat-de-tema";

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
  useAppearanceApplied();

  return (
    <ErrorBoundary where="aplicação">
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TooltipProvider>
            <ConfirmProvider>
              <ErrorBoundary where="telas">
                <AppRoutes data-gc="app.app-routes" />
              </ErrorBoundary>
              <ConnectionState data-gc="app.connection-state" />
              <UpdateNotice data-gc="app.update-notice" />
              <PermissionsNotice data-gc="app.permissions-notice" />
              <NewDeviceNotice data-gc="app.new-device-notice" />
              <VoiceAudioSink data-gc="app.voice-audio-sink" />
              <PointerEffects data-gc="app.pointer-effects" />
              <ScreenPicker data-gc="app.screen-picker" />
              <ImageViewer data-gc="app.image-viewer" />
              <ImportThemeModal data-gc="app.import-theme-modal" />
              <SuperReactionRain data-gc="app.super-reaction-rain" />
              <ToastContainer data-gc="app.toast-container"
                toastClassName={flxCls("notice")}
                position="bottom-center"
                theme="dark"
                autoClose={4000}
                hideProgressBar
              />
              {import.meta.env.DEV && (
                <ReactQueryDevtools data-gc="app.react-query-devtools" initialIsOpen={false} buttonPosition="bottom-right" />
              )}
            </ConfirmProvider>
          </TooltipProvider>
        </SessionProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};
