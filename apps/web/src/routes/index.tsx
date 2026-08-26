import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";

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

const Splash: React.FC = () => (
  <div className="flex min-h-full items-center justify-center bg-surface-2">
    <div className="size-10 animate-pulse rounded-2xl bg-brand" />
  </div>
);
