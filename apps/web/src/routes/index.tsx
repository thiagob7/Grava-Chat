import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";

import { BarraDeTitulo } from "~/components/BarraDeTitulo";

import { FloatingScreenShare } from "~/components/FloatingScreenShare";
import { useSession } from "~/contexts/session-context";
import { useAvisoNoTitulo } from "~/hooks/use-aviso-no-titulo";
import { useConviteDeAviso } from "~/hooks/use-convite-de-aviso";
import { useDisconnectOnLogout } from "~/hooks/use-realtime";
import { SignIn } from "~/pages/presentation/auth/SignIn";
import { Chat } from "~/pages/presentation/chat/Chat";
import { AcceptInvite } from "~/pages/presentation/invite/AcceptInvite";
import { AdicionarBot } from "~/pages/presentation/bot/AdicionarBot";
import { AutorizarApp } from "~/pages/presentation/bot/AutorizarApp";
import { DirectMessages } from "~/pages/presentation/friends/DirectMessages";

export const AppRoutes: React.FC = () => (
  <BrowserRouter>
    {/*
      A coluna vive AQUI, e não no #root: lá dentro moram também o container de
      avisos, o seletor de tela e o visualizador de imagem. Distribuir altura
      entre todos eles deixava a aplicação ocupando um pedaço da janela.
    */}
    <div className="flex h-full flex-col">
      <BarraDeTitulo />

      <div className="min-h-0 flex-1">
    <Routes>
      <Route path="/login" element={<PublicOnly />} />
      <Route
        path="/invite/:code"
        element={
          <Protected>
            <AcceptInvite />
          </Protected>
        }
      />
      <Route
        path="/oauth2/autorizar"
        element={
          <Protected>
            <AutorizarApp />
          </Protected>
        }
      />
      <Route
        path="/bots/:botId/adicionar"
        element={
          <Protected>
            <AdicionarBot />
          </Protected>
        }
      />
      <Route
        path="/dm/:channelId?"
        element={
          <Protected>
            <DirectMessages />
          </Protected>
        }
      />
      <Route
        path="/channels/:guildId?/:channelId?"
        element={
          <Protected>
            <Chat />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/channels" replace />} />
    </Routes>
      </div>
    </div>

    <FloatingScreenShare />
  </BrowserRouter>
);

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBooting } = useSession();
  const location = useLocation();

  useDisconnectOnLogout(Boolean(user), isBooting);
  useAvisoNoTitulo(Boolean(user));
  useConviteDeAviso(Boolean(user));

  if (isBooting) return <Splash />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
};

const PublicOnly: React.FC = () => {
  const { user, isBooting } = useSession();
  const location = useLocation() as { state?: { from?: string } };

  if (isBooting) return <Splash />;
  if (user) return <Navigate to={location.state?.from ?? "/channels"} replace />;

  return <SignIn />;
};

/*
  Tela de espera: o "G" da marca parado e o ponto vermelho pulsando ao lado.

  O ponto é o que pisca, não o logotipo inteiro: marca piscando parece defeito
  de renderização, enquanto o pulso num detalhe lê como "está trabalhando" — e é
  o mesmo ponto vermelho que fecha a marca no login.
*/
const Splash: React.FC = () => (
  <div className="flex min-h-full items-center justify-center gap-2 bg-surface-2">
    <img
      src="/brand/logo g branco.svg"
      alt=""
      className="h-12 w-auto select-none"
      draggable={false}
    />
    <span className="mb-1 size-3 animate-pulse self-end rounded-full bg-brand" />
  </div>
);
