import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";

import { BarraDeTitulo } from "~/features/app/components/BarraDeTitulo";
import { FaixaDaComunidade } from "~/features/servidor/components/FaixaDaComunidade";
import { Splash } from "~/features/app/components/Splash";

import { ChamadaRecebida } from "~/features/voz/components/ChamadaRecebida";
import { FloatingScreenShare } from "~/features/voz/components/FloatingScreenShare";
import { JanelaDoEstudio } from "~/features/configuracoes/components/estudio/JanelaDoEstudio";
import { useSession } from "~/contexts/session-context";
import { useAvisoNoTitulo } from "~/features/app/hooks/use-aviso-no-titulo";
import { useConviteDeAviso } from "~/features/app/hooks/use-convite-de-aviso";
import { useLinksDoDesktop } from "~/features/app/hooks/use-links-do-desktop";
import { useDisconnectOnLogout } from "~/hooks/use-realtime";
import { SignIn } from "~/pages/presentation/auth/SignIn";
import { Chat } from "~/pages/presentation/chat/Chat";
import { AcceptInvite } from "~/pages/presentation/invite/AcceptInvite";
import { AdicionarBot } from "~/pages/presentation/bot/AdicionarBot";
import { AutorizarApp } from "~/pages/presentation/bot/AutorizarApp";
import { DirectMessages } from "~/pages/presentation/friends/DirectMessages";
import { Explorar } from "~/pages/presentation/descoberta/Explorar";
import { EstudioEmJanela } from "~/pages/presentation/estudio/EstudioEmJanela";
import { VerTema } from "~/pages/presentation/tema/VerTema";
import { useConfigPorUrl } from "~/features/app/hooks/use-config-por-url";
import { ContaEmExclusao } from "~/features/perfil/components/ContaEmExclusao";
import { flx } from "~/lib/compat-fluxer";

export const AppRoutes: React.FC = () => {
  useConfigPorUrl();

  return (
  <BrowserRouter>
    <div data-gc="routes.div" className="flex h-full flex-col">
      <CascaDoApp data-gc="routes.casca-do-app">
      <div data-gc="routes.div--2" {...flx("molduraDoApp", "min-h-0 flex-1")}>
    <Routes>
      <Route path="/login" element={<PublicOnly data-gc="routes.public-only" />} />
      <Route
        path="/invite/:code"
        element={
          <Protected data-gc="routes.protected">
            <AcceptInvite data-gc="routes.accept-invite" />
          </Protected>
        }
      />
      <Route
        path="/oauth2/autorizar"
        element={
          <Protected data-gc="routes.protected--2">
            <AutorizarApp data-gc="routes.autorizar-app" />
          </Protected>
        }
      />
      <Route
        path="/bots/:botId/adicionar"
        element={
          <Protected data-gc="routes.protected--3">
            <AdicionarBot data-gc="routes.adicionar-bot" />
          </Protected>
        }
      />
      <Route
        path="/dm/:channelId?"
        element={
          <Protected data-gc="routes.protected--4">
            <DirectMessages data-gc="routes.direct-messages" />
          </Protected>
        }
      />
      <Route
        path="/tema/:temaId"
        element={
          <Protected data-gc="routes.protected--5">
            <VerTema data-gc="routes.ver-tema" />
          </Protected>
        }
      />
      <Route
        path="/estudio"
        element={
          <Protected data-gc="routes.protected--6">
            <EstudioEmJanela data-gc="routes.estudio-em-janela" />
          </Protected>
        }
      />
      <Route
        path="/explorar"
        element={
          <Protected data-gc="routes.protected--7">
            <Explorar data-gc="routes.explorar" />
          </Protected>
        }
      />
      <Route
        path="/channels/:guildId?/:channelId?"
        element={
          <Protected data-gc="routes.protected--8">
            <Chat data-gc="routes.chat" />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/channels" replace />} />
    </Routes>
      </div>
      </CascaDoApp>
    </div>

    <FloatingScreenShare data-gc="routes.floating-screen-share" />
    <JanelaDoEstudio data-gc="routes.janela-do-estudio" />
    <ChamadaRecebida data-gc="routes.chamada-recebida" />
    <LinksDoDesktop data-gc="routes.links-do-desktop" />
  </BrowserRouter>
  );
};

/*
  A janela à parte do estúdio roda na mesma aplicação, então cai nas mesmas
  rotas. Ela não é o app: não leva a barra de título do servidor nem a faixa da
  comunidade em cima.
*/
const CascaDoApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();

  if (pathname === "/estudio") return <>{children}</>;

  return (
    <>
      <BarraDeTitulo data-gc="routes.barra-de-titulo" />

      <div data-gc="routes.div--3" className="relative">
        <FaixaDaComunidade data-gc="routes.faixa-da-comunidade" />
      </div>

      {children}
    </>
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

  if (isBooting) return <Splash data-gc="routes.splash" />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.excluirEm) return <ContaEmExclusao data-gc="routes.conta-em-exclusao.end-session" user={user} onSair={endSession} />;

  return <>{children}</>;
};

const PublicOnly: React.FC = () => {
  const { user, isBooting } = useSession();
  const location = useLocation() as { state?: { from?: string } };

  if (isBooting) return <Splash data-gc="routes.splash--2" />;
  if (user) return <Navigate to={location.state?.from ?? "/channels"} replace />;

  return <SignIn data-gc="routes.sign-in" />;
};
