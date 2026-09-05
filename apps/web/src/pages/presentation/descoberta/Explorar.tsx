import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Compass, LayoutGrid, Menu, Palette, Search, Users, X } from "lucide-react";
import {
  CATEGORIAS_DE_COMUNIDADE,
  MEMBROS_PARA_DESCOBRIR,
  NOMES_DE_CATEGORIA,
  type CategoriaDeComunidade,
} from "@gravae/shared";

import {
  useComunidades,
  useEntrarNaComunidade,
} from "~/@core/application/queries/descoberta/use-descoberta";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { CartaoDeComunidade } from "~/features/descoberta/components/CartaoDeComunidade";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { useAtraso } from "~/hooks/use-atraso";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";

type Aba = "comunidades" | "aplicativos" | "temas";

const ABAS: { id: Aba; nome: string; icone: React.ElementType; emBreve?: boolean }[] = [
  { id: "comunidades", nome: "Comunidades", icone: Users },
  { id: "aplicativos", nome: "Aplicativos", icone: LayoutGrid, emBreve: true },
  { id: "temas", nome: "Temas", icone: Palette, emBreve: true },
];

export const Explorar: React.FC = () => {
  const navigate = useNavigate();
  const telaEstreita = useTelaEstreita();
  const { data: relacoes = [] } = useFindFriends(true);

  const [aba, setAba] = useState<Aba>("comunidades");
  const [categoria, setCategoria] = useState<CategoriaDeComunidade | null>(null);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  const pendentes = relacoes.filter((r) => r.status === "PENDING_IN").length;

  const navegacao = (
    <>
      <GuildRail
        activeGuildId={null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pendentes}
      />

      <aside className="flex w-60 shrink-0 flex-col bg-surface-1">
        <header className="regiao-de-arrasto flex h-12 shrink-0 items-center px-4">
          <h1 className="text-base font-semibold">Explorar</h1>
        </header>

        <nav className="flex flex-col gap-0.5 p-2">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.emBreve}
              onClick={() => {
                setAba(item.id);
                setMenuAberto(false);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition",
                aba === item.id
                  ? "bg-selecionado text-ink"
                  : "text-ink-muted hover:bg-hover hover:text-ink",
                item.emBreve && "cursor-default opacity-60 hover:bg-transparent",
              )}
            >
              <item.icone size={18} className="shrink-0" />
              <span className="min-w-0 flex-1 truncate font-medium">{item.nome}</span>

              {item.emBreve && (
                <span className="shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-10 font-semibold uppercase tracking-wide text-ink-faint">
                  em breve
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );

  return (
    <div className="flex h-full bg-surface-0">
      {telaEstreita ? (
        <Sheet open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle className="sr-only">Explorar</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      <div className="topo-do-miolo flex min-w-0 flex-1 flex-col">
        <header className="regiao-de-arrasto flex h-12 shrink-0 items-center gap-3 border-b border-divisor bg-surface-2 px-4">
          {telaEstreita && (
            <button
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir o Explorar"
              className="rounded p-1 text-ink-faint transition hover:text-ink"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="regiao-sem-arrasto flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            <Filtro
              ativo={categoria === null}
              nome="Todos"
              onEscolher={() => setCategoria(null)}
            />

            {CATEGORIAS_DE_COMUNIDADE.map((id) => (
              <Filtro
                key={id}
                ativo={categoria === id}
                nome={NOMES_DE_CATEGORIA[id]}
                onEscolher={() => setCategoria(id)}
              />
            ))}
          </div>

          <div className={cn(grupoDeCampo, "regiao-sem-arrasto h-8 w-56 shrink-0")}>
            <Search size={14} className="shrink-0 text-ink-faint" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar comunidades"
              aria-label="Buscar comunidades"
              className={campoNu}
            />
            {busca && (
              <button
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar a busca"
                className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {aba === "comunidades" && <Comunidades categoria={categoria} busca={busca} />}
        </div>
      </div>
    </div>
  );
};

const Filtro: React.FC<{ ativo: boolean; nome: string; onEscolher: () => void }> = ({
  ativo,
  nome,
  onEscolher,
}) => (
  <button
    type="button"
    onClick={onEscolher}
    className={cn(
      "shrink-0 rounded px-3 py-1.5 text-sm font-medium transition",
      ativo ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
    )}
  >
    {nome}
  </button>
);

const Comunidades: React.FC<{ categoria: CategoriaDeComunidade | null; busca: string }> = ({
  categoria,
  busca,
}) => {
  const navigate = useNavigate();
  const entrar = useEntrarNaComunidade();

  const termo = useAtraso(busca.trim());

  const { data: comunidades, isLoading } = useComunidades({
    categoria: categoria ?? undefined,
    busca: termo || undefined,
  });

  if (isLoading || !comunidades)
    return (
      <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );

  if (!comunidades.length)
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <Compass size={36} className="text-ink-faint" />
        <div>
          <p className="text-sm font-medium">
            {termo ? "Nenhuma comunidade com esse nome" : "Ainda não há o que explorar"}
          </p>
          <p className="mt-1 max-w-sm text-xs text-ink-faint">
            {termo
              ? "Tente outro termo, ou tire o filtro de categoria."
              : `Só entram aqui as comunidades a partir de ${MEMBROS_PARA_DESCOBRIR} membros. Assim que uma chegar lá, ela aparece sozinha.`}
          </p>
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {comunidades.map((comunidade) => (
        <CartaoDeComunidade
          key={comunidade.id}
          comunidade={comunidade}
          entrando={entrar.isPending && entrar.variables === comunidade.id}
          onAbrir={() => navigate(`/channels/${comunidade.id}`)}
          onEntrar={() =>
            entrar.mutate(comunidade.id, {
              onSuccess: ({ guildId }) => navigate(`/channels/${guildId}`),
            })
          }
        />
      ))}
    </div>
  );
};
