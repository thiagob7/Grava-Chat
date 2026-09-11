import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router";

import { TitleBar } from "~/features/app/components/BarraDeTitulo";
import { ShellLoading } from "~/features/app/components/CascaCarregando";
import { CommunityTrack } from "~/features/servidor/components/FaixaDaComunidade";
import { Splash } from "~/features/app/components/Splash";

import { CallReceived } from "~/features/voz/components/ChamadaRecebida";
import { FloatingScreenShare } from "~/features/voz/components/FloatingScreenShare";
import { ThemeOffNotice } from "~/features/configuracoes/components/AvisoDeTemaDesligado";
import { StudioWindow } from "~/features/configuracoes/components/estudio/JanelaDoEstudio";
import { CursorsWindow } from "~/features/configuracoes/components/estudio/JanelaDeCursores";
import { useSession } from "~/contexts/session-context";
import { useNoticeTitle } from "~/features/app/hooks/use-aviso-no-titulo";
import { useInviteNotice } from "~/features/app/hooks/use-convite-de-aviso";
import { useLinksDoDesktop } from "~/features/app/hooks/use-links-do-desktop";
import { useDisconnectOnLogout } from "~/hooks/use-realtime";
import { ResetPassword } from "~/pages/presentation/auth/RedefinirSenha";
import { VerifyEmail } from "~/pages/presentation/auth/VerificarEmail";
import { SignIn } from "~/pages/presentation/auth/SignIn";

const Admin = React.lazy(() => import("~/pages/presentation/admin/Admin"));
import { Chat } from "~/pages/presentation/chat/Chat";
import { AcceptInvite } from "~/pages/presentation/invite/AcceptInvite";
import { AddBot } from "~/pages/presentation/bot/AdicionarBot";
import { AuthorizeApp } from "~/pages/presentation/bot/AutorizarApp";
import { DirectMessages } from "~/pages/presentation/friends/DirectMessages";
import { Explore } from "~/pages/presentation/descoberta/Explorar";
import { StudioInWindow } from "~/pages/presentation/estudio/EstudioEmJanela";
import { CursorsInWindow } from "~/pages/presentation/cursores/CursoresEmJanela";
import { SeeTheme } from "~/pages/presentation/tema/VerTema";
import { useConfigByUrl } from "~/features/app/hooks/use-config-por-url";
import { AccountDeletion } from "~/features/perfil/components/ContaEmExclusao";
import { ThemeBackground } from "~/features/tema/components/FundoDoTema";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";
import { isDesktop } from "~/lib/desktop";

export const AppRoutes: React.FC = () => {
  useConfigByUrl();

  return (
  <BrowserRouter>
    <ThemeBackground data-gc="routes.theme-background" />
    <div data-gc="routes.div" {...flx("containerDoApp", "flex h-full flex-col")}>
      <AppShell data-gc="routes.app-shell">
      <div data-gc="routes.div--2" {...flxAttr("frameExternal")} {...flx("appFrame", cn("moldura-externa min-h-0 flex-1 overflow-x-hidden", flxCls("frameExternal")))}>
    <Routes>
      <Route path="/login" element={<PublicOnly data-gc="routes.public-only" />} />
      <Route path="/redefinir" element={<ResetPassword data-gc="routes.reset-password" />} />
      <Route path="/verificar-email" element={<VerifyEmail data-gc="routes.verify-email" />} />
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
        path="/apps/:botId"
        element={
          <Protected data-gc="routes.protected--3">
            <Explore data-gc="routes.explore" />
          </Protected>
        }
      />
      <Route
        path="/oauth2/autorizar"
        element={
          <Protected data-gc="routes.protected--4">
            <AuthorizeApp data-gc="routes.authorize-app" />
          </Protected>
        }
      />
      <Route
        path="/bots/:botId/adicionar"
        element={
          <Protected data-gc="routes.protected--5">
            <AddBot data-gc="routes.add-bot" />
          </Protected>
        }
      />
      <Route
        path="/dm/solicitacoes"
        element={
          <Protected data-gc="routes.protected--6">
            <DirectMessages data-gc="routes.direct-messages" requests />
          </Protected>
        }
      />
      <Route
        path="/dm/:channelId?"
        element={
          <Protected data-gc="routes.protected--7">
            <DirectMessages data-gc="routes.direct-messages--2" />
          </Protected>
        }
      />
      <Route
        path="/tema/:temaId"
        element={
          <Protected data-gc="routes.protected--8">
            <SeeTheme data-gc="routes.see-theme" />
          </Protected>
        }
      />
      <Route
        path="/estudio"
        element={
          <Protected data-gc="routes.protected--9">
            <StudioInWindow data-gc="routes.studio-in-window" />
          </Protected>
        }
      />
      <Route
        path="/cursores"
        element={
          <Protected data-gc="routes.protected--10">
            <CursorsInWindow data-gc="routes.cursors-in-window" />
          </Protected>
        }
      />
      <Route
        path="/explorar"
        element={
          <Protected data-gc="routes.protected--11">
            <Explore data-gc="routes.explore--2" />
          </Protected>
        }
      />
      <Route
        path="/channels/:guildId?/:channelId?"
        element={
          <Protected data-gc="routes.protected--12">
            <Chat data-gc="routes.chat" />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/channels" replace />} />
    </Routes>
      </div>
      </AppShell>
    </div>

    <FloatingScreenShare data-gc="routes.floating-screen-share" />
    <StudioWindow data-gc="routes.studio-window" />
    <CursorsWindow data-gc="routes.cursors-window" />
    <ThemeOffNotice data-gc="routes.theme-off-notice" />
    <CallReceived data-gc="routes.call-received" />
    <LinksDoDesktop data-gc="routes.links-do-desktop" />
  </BrowserRouter>
  );
};

const WINDOWS_OWN = ["/estudio", "/cursores"];

const BRAND_SCREENS = [/^\/login$/, /^\/redefinir$/, /^\/verificar-email$/, /^\/oauth2\/autorizar$/, /^\/bots\/[^/]+\/adicionar$/];

const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation();

  if (WINDOWS_OWN.includes(pathname)) return <>{children}</>;

  if (!isDesktop() && BRAND_SCREENS.some((display) => display.test(pathname))) return <>{children}</>;

  return (
    <>
      <TitleBar data-gc="routes.title-bar" />

      <div data-gc="routes.div--3" className="relative">
        <CommunityTrack data-gc="routes.community-track" />
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
  useNoticeTitle(Boolean(user));
  useInviteNotice(Boolean(user));

  if (isBooting) return <ShellLoading data-gc="routes.shell-loading" />;

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (user.deleteAt) return <AccountDeletion data-gc="routes.account-deletion.end-session" user={user} onLeave={endSession} />;

  return <>{children}</>;
};

const PublicOnly: React.FC = () => {
  const { user, isBooting } = useSession();
  const location = useLocation() as { state?: { from?: string } };

  if (isBooting) return <Splash data-gc="routes.splash--2" />;
  if (user) return <Navigate to={location.state?.from ?? "/channels"} replace />;

  return <SignIn data-gc="routes.sign-in" />;
};
