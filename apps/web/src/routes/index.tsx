import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";

import { BarraDeTitulo } from "~/components/BarraDeTitulo";
import { FaixaDaComunidade } from "~/features/servidor/components/FaixaDaComunidade";
import { Splash } from "~/components/Splash";

import { ChamadaRecebida } from "~/features/voz/components/ChamadaRecebida";
import { FloatingScreenShare } from "~/features/voz/components/FloatingScreenShare";
import { useSession } from "~/contexts/session-context";
import { useAvisoNoTitulo } from "~/hooks/use-aviso-no-titulo";
import { useConviteDeAviso } from "~/hooks/use-convite-de-aviso";
import { useLinksDoDesktop } from "~/hooks/use-links-do-desktop";
import { useDisconnectOnLogout } from "~/hooks/use-realtime";
import { SignIn } from "~/pages/presentation/auth/SignIn";
import { Chat } from "~/pages/presentation/chat/Chat";
import { AcceptInvite } from "~/pages/presentation/invite/AcceptInvite";
import { AdicionarBot } from "~/pages/presentation/bot/AdicionarBot";
import { AutorizarApp } from "~/pages/presentation/bot/AutorizarApp";
import { DirectMessages } from "~/pages/presentation/friends/DirectMessages";
import { useConfigPorUrl } from "~/hooks/use-config-por-url";
import { ContaEmExclusao } from "~/features/perfil/components/ContaEmExclusao";

export const AppRoutes: React.FC = () => {
  useConfigPorUrl();

  return (
  <BrowserRouter>
    <div className="flex h-full flex-col">
      <BarraDeTitulo />

      <div className="relative">
        <FaixaDaComunidade />
      </div>

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
    <ChamadaRecebida />
    <LinksDoDesktop />
  </BrowserRouter>
  );
};

const LinksDoDesktop: React.FC = () => {
  useLinksDoDesktop();
  return null;
};

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isBooting, endSession } = useSession();
  const location = useLocation();

  useDisconnectOnLogout(Boolean(user), isBooting);
  useAvisoNoTitulo(Boolean(user));
  useConviteDeAviso(Boolean(user));

  if (isBooting) return <Splash />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.excluirEm) return <ContaEmExclusao user={user} onSair={endSession} />;

  return <>{children}</>;
};

const PublicOnly: React.FC = () => {
  const { user, isBooting } = useSession();
  const location = useLocation() as { state?: { from?: string } };

  if (isBooting) return <Splash />;
  if (user) return <Navigate to={location.state?.from ?? "/channels"} replace />;

  return <SignIn />;
};
