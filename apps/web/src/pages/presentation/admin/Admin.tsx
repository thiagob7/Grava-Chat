import React from "react";
import { Link, Navigate, useParams } from "react-router";
import { ArrowLeft, Flag, Megaphone, Rocket, Server } from "lucide-react";

import { useMe } from "~/@core/application/queries/auth/use-me";
import { ComunicadosSection } from "~/features/configuracoes/components/ComunicadosSection";
import { DenunciasSection } from "~/features/configuracoes/components/DenunciasSection";
import { PublicacoesSection } from "~/features/configuracoes/components/PublicacoesSection";
import { ServidorSection } from "~/features/configuracoes/components/ServidorSection";
import { Splash } from "~/features/app/components/Splash";
import { cn } from "~/lib/utils";

type Tela = "publicacoes" | "servidor" | "denuncias" | "comunicado";

const TELAS: { id: Tela; nome: string; icone: React.ElementType; resumo: string }[] = [
  { id: "publicacoes", nome: "Publicações", icone: Rocket, resumo: "o que roda em cada máquina" },
  { id: "servidor", nome: "Servidor", icone: Server, resumo: "saúde das máquinas" },
  { id: "denuncias", nome: "Denúncias", icone: Flag, resumo: "a fila do que chegou" },
  { id: "comunicado", nome: "Comunicado", icone: Megaphone, resumo: "avisar todo mundo" },
];

export const Admin: React.FC = () => {
  const { tela } = useParams<{ tela?: string }>();
  const { data: eu, isPending } = useMe(true);

  if (isPending) return <Splash data-gc="admin.admin.splash" />;
  if (!eu?.admin) return <Navigate to="/channels" replace />;

  const atual = (TELAS.find((t) => t.id === tela)?.id ?? "publicacoes") as Tela;

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
          {TELAS.map((item) => (
            <Link data-gc="admin.admin.link--2"
              key={item.id}
              to={`/admin/${item.id}`}
              className={cn(
                "flex items-start gap-2.5 rounded px-2.5 py-2 text-left text-sm transition",
                atual === item.id
                  ? "bg-selecionado text-ink"
                  : "text-ink-muted hover:bg-hover hover:text-ink",
              )}
            >
              <item.icone data-gc="admin.admin.itemicone" size={18} className="mt-0.5 shrink-0" />
              <span data-gc="admin.admin.span" className="min-w-0">
                <span data-gc="admin.admin.span--2" className="block truncate font-medium">{item.nome}</span>
                <span data-gc="admin.admin.span--3" className="block truncate text-11 text-ink-faint">{item.resumo}</span>
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
          <h2 data-gc="admin.admin.h2" className="truncate font-semibold">{TELAS.find((t) => t.id === atual)?.nome}</h2>
        </header>

        <div data-gc="admin.admin.div--4" className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {atual === "publicacoes" && <PublicacoesSection data-gc="admin.admin.publicacoes-section" />}
          {atual === "servidor" && <ServidorSection data-gc="admin.admin.servidor-section" />}
          {atual === "denuncias" && <DenunciasSection data-gc="admin.admin.denuncias-section" />}
          {atual === "comunicado" && <ComunicadosSection data-gc="admin.admin.comunicados-section" />}
        </div>
      </div>
    </div>
  );
};

export default Admin;
