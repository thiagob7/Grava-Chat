import React from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, Flag, Megaphone, Rocket, Server } from "lucide-react";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { AnnouncementsSection } from "~/features/configuracoes/components/ComunicadosSection";
import { ReportsSection } from "~/features/configuracoes/components/DenunciasSection";
import { PostsSection } from "~/features/configuracoes/components/PublicacoesSection";
import { ServerSection } from "~/features/configuracoes/components/ServidorSection";
import { Splash } from "~/features/app/components/Splash";
import { cn } from "~/lib/utils";

type Display = "publicacoes" | "servidor" | "denuncias" | "comunicado";

const SCREENS: { id: Display; name: string; icon: React.ElementType; summary: string }[] = [
  { id: "publicacoes", name: "Publicações", icon: Rocket, summary: "o que roda em cada máquina" },
  { id: "servidor", name: "Servidor", icon: Server, summary: "saúde das máquinas" },
  { id: "denuncias", name: "Denúncias", icon: Flag, summary: "a fila do que chegou" },
  { id: "comunicado", name: "Comunicado", icon: Megaphone, summary: "avisar todo mundo" },
];

export const Admin: React.FC = () => {
  const { display } = useParams<{ display?: string }>();
  const { data: eu, isPending } = useMe(true);

  if (isPending) return <Splash data-gc="admin.admin.splash" />;
  if (!eu?.admin) return <Navigate to="/channels" replace />;

  const current = (SCREENS.find((t) => t.id === display)?.id ?? "publicacoes") as Display;

  return (
    <div data-gc="admin.admin.div" className="flex h-full bg-surface-0">
      <aside data-gc="admin.admin.aside" className="flex w-64 shrink-0 flex-col border-r border-divisor bg-surface-1">
        <header data-gc="admin.admin.header" className="flex h-[var(--layout-header-height)] shrink-0 items-center gap-2 border-b border-divisor px-4">
          <Link data-gc="admin.admin.link"
            to="/channels"
            aria-label="Voltar para o app"
            className="rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
          >
            <ArrowLeft data-gc="admin.admin.arrow-left" size={18} />
          </Link>
          <h1 data-gc="admin.admin.h1" className="truncate font-semibold">Administração</h1>
        </header>

        <nav data-gc="admin.admin.nav" className="flex flex-col gap-0.5 px-2 py-3">
          {SCREENS.map((item) => (
            <Link data-gc="admin.admin.link--2"
              key={item.id}
              to={`/admin/${item.id}`}
              className={cn(
                "flex items-start gap-2.5 rounded px-2.5 py-2 text-left text-sm transition",
                current === item.id
                  ? "bg-selecionado text-ink"
                  : "text-ink-muted hover:bg-hover hover:text-ink",
              )}
            >
              <item.icon data-gc="admin.admin.itemicon" size={18} className="mt-0.5 shrink-0" />
              <span data-gc="admin.admin.span" className="min-w-0">
                <span data-gc="admin.admin.span--2" className="block truncate font-medium">{item.name}</span>
                <span data-gc="admin.admin.span--3" className="block truncate text-11 text-ink-faint">{item.summary}</span>
              </span>
            </Link>
          ))}
        </nav>

        <div data-gc="admin.admin.div--2" className="mt-auto px-4 py-3 text-11 leading-4 text-ink-faint">
          Você vê isto porque seu e-mail está na lista de administração da API.
        </div>
      </aside>

      <div data-gc="admin.admin.div--3" className="flex min-w-0 flex-1 flex-col">
        <header data-gc="admin.admin.header--2" className="flex h-[var(--layout-header-height)] shrink-0 items-center border-b border-divisor bg-surface-2 px-6">
          <h2 data-gc="admin.admin.h2" className="truncate font-semibold">{SCREENS.find((t) => t.id === current)?.name}</h2>
        </header>

        <div data-gc="admin.admin.div--4" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {current === "publicacoes" && <PostsSection data-gc="admin.admin.posts-section" />}
          {current === "servidor" && <ServerSection data-gc="admin.admin.server-section" />}
          {current === "denuncias" && <ReportsSection data-gc="admin.admin.reports-section" />}
          {current === "comunicado" && <AnnouncementsSection data-gc="admin.admin.announcements-section" />}
        </div>
      </div>
    </div>
  );
};

export default Admin;
