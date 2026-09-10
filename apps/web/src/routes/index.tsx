import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";

import { BarraDeTitulo } from "~/features/app/components/BarraDeTitulo";
import { CascaCarregando } from "~/features/app/components/CascaCarregando";
import { FaixaDaComunidade } from "~/features/servidor/components/FaixaDaComunidade";
import { Splash } from "~/features/app/components/Splash";

import { ChamadaRecebida } from "~/features/voz/components/ChamadaRecebida";
import { FloatingScreenShare } from "~/features/voz/components/FloatingScreenShare";
import { AvisoDeTemaDesligado } from "~/features/configuracoes/components/AvisoDeTemaDesligado";
import { JanelaDoEstudio } from "~/features/configuracoes/components/estudio/JanelaDoEstudio";
import { JanelaDeCursores } from "~/features/configuracoes/components/estudio/JanelaDeCursores";
import { useSession } from "~/contexts/session-context";
import { useAvisoNoTitulo } from "~/features/app/hooks/use-aviso-no-titulo";
import { useConviteDeAviso } from "~/features/app/hooks/use-convite-de-aviso";
import { useLinksDoDesktop } from "~/features/app/hooks/use-links-do-desktop";
import { useDisconnectOnLogout } from "~/hooks/use-realtime";
import { RedefinirSenha } from "~/pages/presentation/auth/RedefinirSenha";
import { SignIn } from "~/pages/presentation/auth/SignIn";

const Admin = React.lazy(() => import("~/pages/presentation/admin/Admin"));
import { Chat } from "~/pages/presentation/chat/Chat";
import { AcceptInvite } from "~/pages/presentation/invite/AcceptInvite";
import { AdicionarBot } from "~/pages/presentation/bot/AdicionarBot";
import { AutorizarApp } from "~/pages/presentation/bot/AutorizarApp";
import { DirectMessages } from "~/pages/presentation/friends/DirectMessages";
import { Explorar } from "~/pages/presentation/descoberta/Explorar";
import { EstudioEmJanela } from "~/pages/presentation/estudio/EstudioEmJanela";
import { CursoresEmJanela } from "~/pages/presentation/cursores/CursoresEmJanela";
import { VerTema } from "~/pages/presentation/tema/VerTema";
import { useConfigPorUrl } from "~/features/app/hooks/use-config-por-url";
import { ContaEmExclusao } from "~/features/perfil/components/ContaEmExclusao";
import { FundoDoTema } from "~/features/tema/components/FundoDoTema";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

export const AppRoutes: React.FC = () => {
  useConfigPorUrl();

  return (
  <BrowserRouter>
    <FundoDoTema data-gc="routes.fundo-do-tema" />
    <div data-gc="routes.div" {...flx("containerDoApp", "flex h-full flex-col")}>
      <CascaDoApp data-gc="routes.casca-do-app">
      <div data-gc="routes.div--2" {...flxAttr("molduraExterna")} {...flx("molduraDoApp", cn("moldura-externa min-h-0 flex-1 overflow-x-hidden", flxCls("molduraExterna")))}>
    <Routes>
      <Route path="/login" element={<PublicOnly data-gc="routes.public-only" />} />
      <Route path="/redefinir" element={<RedefinirSenha data-gc="routes.redefinir-senha" />} />
      <Route
        path="/admin/:tela?"
        element={
          <Protected data-gc="routes.protected">
            <React.Suspense data-gc="routes.reactsuspense" fallback={<Splash data-gc="routes.splash" />}>
              <Admin data-gc="routes.admin" />
            </React.Suspense>
          </Protected>
        }
      />
      <Route
        path="/invite/:code"
        element={
          <Protected data-gc="routes.protected--2">
            <AcceptInvite data-gc="routes.accept-invite" />
          </Protected>
        }
      />
      <Route
        path="/oauth2/autorizar"
        element={
          <Protected data-gc="routes.protected--3">
            <AutorizarApp data-gc="routes.autorizar-app" />
          </Protected>
        }
      />
      <Route
        path="/bots/:botId/adicionar"
        element={
          <Protected data-gc="routes.protected--4">
            <AdicionarBot data-gc="routes.adicionar-bot" />
          </Protected>
        }
      />
      <Route
        path="/dm/solicitacoes"
        element={
          <Protected data-gc="routes.protected--5">
            <DirectMessages data-gc="routes.direct-messages" solicitacoes />
          </Protected>
        }
      />
      <Route
        path="/dm/:channelId?"
        element={
          <Protected data-gc="routes.protected--6">
            <DirectMessages data-gc="routes.direct-messages--2" />
          </Protected>
        }
      />
      <Route
        path="/tema/:temaId"
        element={
          <Protected data-gc="routes.protected--7">
            <VerTema data-gc="routes.ver-tema" />
          </Protected>
        }
      />
      <Route
        path="/estudio"
        element={
          <Protected data-gc="routes.protected--8">
            <EstudioEmJanela data-gc="routes.estudio-em-janela" />
          </Protected>
        }
      />
      <Route
        path="/cursores"
        element={
          <Protected data-gc="routes.protected--9">
            <CursoresEmJanela data-gc="routes.cursores-em-janela" />
          </Protected>
        }
      />
      <Route
        path="/explorar"
        element={
          <Protected data-gc="routes.protected--10">
            <Explorar data-gc="routes.explorar" />
          </Protected>
        }
      />
      <Route
        path="/channels/:guildId?/:channelId?"
        element={
          <Protected data-gc="routes.protected--11">
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
    <JanelaDeCursores data-gc="routes.janela-de-cursores" />
    <AvisoDeTemaDesligado data-gc="routes.aviso-de-tema-desligado" />
    <ChamadaRecebida data-gc="routes.chamada-recebida" />
    <LinksDoDesktop data-gc="routes.links-do-desktop" />
  </BrowserRouter>
  );
};

const CascaDoApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();

  if (pathname === "/estudio" || pathname === "/cursores") return <>{children}</>;

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

  if (isBooting) return <CascaCarregando data-gc="routes.casca-carregando" />;

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
