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
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { useSession } from "~/contexts/session-context";
import { campoNu, grupoDeCampo } from "~/components/ui/input";
import { AlcaDeLargura, useLarguraAjustavel } from "~/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { CartaoDeComunidade } from "~/features/descoberta/components/CartaoDeComunidade";
import { ColunaDaEsquerda } from "~/features/app/components/ColunaDaEsquerda";
import { RodapeDaBarra } from "~/features/app/components/RodapeDaBarra";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { useAtraso } from "~/hooks/use-atraso";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-fluxer";

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
  const { user, endSession } = useSession();
  const logout = useLogout();

  const sair = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  const { largura, arrastando, alca, limites } = useLarguraAjustavel("explorar", {
    padrao: 240,
    token: "--layout-sidebar-width",
    min: 180,
    max: 420,
    borda: "direita",
  });

  const [aba, setAba] = useState<Aba>("comunidades");
  const [categoria, setCategoria] = useState<CategoriaDeComunidade | null>(null);
  const [busca, setBusca] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  const pendentes = relacoes.filter((r) => r.status === "PENDING_IN").length;

  const navegacao = (
    <ColunaDaEsquerda data-gc="descoberta.explorar.coluna-da-esquerda" rodape={<RodapeDaBarra data-gc="descoberta.explorar.rodape-da-barra" user={user} onLogout={() => void sair()} />}>
      <GuildRail data-gc="descoberta.explorar.guild-rail"
        activeGuildId={null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pendentes}
      />

      <aside data-gc="descoberta.explorar.aside"
        className="canto-do-miolo topo-do-miolo relative flex shrink-0 flex-col border-x border-divisor bg-surface-1"
        style={{ width: largura }}
      >
      {/*
        O painel termina onde o rodapé começa, e o rodapé fica de fora dele. No
        Fluxer esses dois são irmãos, e é o que faz a borda do tema parar em
        cima em vez de cercar o usuário junto.
      */}
        <div data-gc="descoberta.explorar.div" {...flx("listaDeConversas", "lista-de-comunidades flex min-h-0 flex-1 flex-col")}>
        <header data-gc="descoberta.explorar.header" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto flex h-[var(--layout-header-height)] shrink-0 items-center border-b border-divisor px-4 shadow-sm")}>
          <h1 data-gc="descoberta.explorar.h1" className="truncate font-semibold">Explorar</h1>
        </header>

        <nav data-gc="descoberta.explorar.nav" className="flex flex-col gap-0.5 px-2 py-3">
          {ABAS.map((item) => (
            <button data-gc="descoberta.explorar.button"
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
              <item.icone data-gc="descoberta.explorar.itemicone" size={18} className="shrink-0" />
              <span data-gc="descoberta.explorar.span" className="min-w-0 flex-1 truncate font-medium">{item.nome}</span>

              {item.emBreve && (
                <span data-gc="descoberta.explorar.span--2" className="shrink-0 rounded bg-surface-3 px-1.5 py-0.5 text-10 font-semibold uppercase tracking-wide text-ink-faint">
                  em breve
                </span>
              )}
            </button>
          ))}
        </nav>

        <div data-gc="descoberta.explorar.div--2" className="mt-auto" />
        </div>


        <AlcaDeLargura data-gc="descoberta.explorar.alca-de-largura"
          borda="direita"
          arrastando={arrastando}
          largura={largura}
          limites={limites}
          {...alca}
        />
      </aside>
    </ColunaDaEsquerda>
  );

  return (
    <div data-gc="descoberta.explorar.div--3" className="flex h-full bg-surface-0">
      {telaEstreita ? (
        <Sheet data-gc="descoberta.explorar.sheet.set-menu-aberto" open={menuAberto} onOpenChange={setMenuAberto}>
          <SheetContent data-gc="descoberta.explorar.sheet-content" className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle data-gc="descoberta.explorar.sheet-title" className="sr-only">Explorar</SheetTitle>
            {navegacao}
          </SheetContent>
        </Sheet>
      ) : (
        navegacao
      )}

      <div data-gc="descoberta.explorar.div--4" {...flx("explorar", "topo-do-miolo flex min-w-0 flex-1 flex-col")}>
        <header data-gc="descoberta.explorar.header--2" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto flex h-[var(--layout-header-height)] shrink-0 items-center gap-3 border-b border-divisor bg-surface-2 px-4")}>
          {telaEstreita && (
            <button data-gc="descoberta.explorar.button--2"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir o Explorar"
              className="rounded p-1 text-ink-faint transition hover:text-ink"
            >
              <Menu data-gc="descoberta.explorar.menu" size={20} />
            </button>
          )}

          <div data-gc="descoberta.explorar.div--5" className="regiao-sem-arrasto flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            <Filtro data-gc="descoberta.explorar.filtro"
              ativo={categoria === null}
              nome="Todos"
              onEscolher={() => setCategoria(null)}
            />

            {CATEGORIAS_DE_COMUNIDADE.map((id) => (
              <Filtro data-gc="descoberta.explorar.filtro--2"
                key={id}
                ativo={categoria === id}
                nome={NOMES_DE_CATEGORIA[id]}
                onEscolher={() => setCategoria(id)}
              />
            ))}
          </div>

          <div data-gc="descoberta.explorar.div--6" className={cn(grupoDeCampo, "regiao-sem-arrasto h-8 w-56 shrink-0")}>
            <Search data-gc="descoberta.explorar.search" size={14} className="shrink-0 text-ink-faint" />
            <input data-gc="descoberta.explorar.input"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar comunidades"
              aria-label="Buscar comunidades"
              className={campoNu}
            />
            {busca && (
              <button data-gc="descoberta.explorar.button--3"
                type="button"
                onClick={() => setBusca("")}
                aria-label="Limpar a busca"
                className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
              >
                <X data-gc="descoberta.explorar.x" size={14} />
              </button>
            )}
          </div>
        </header>

        <div data-gc="descoberta.explorar.div--7" className="min-h-0 flex-1 overflow-y-auto p-5">
          {aba === "comunidades" && <Comunidades data-gc="descoberta.explorar.comunidades" categoria={categoria} busca={busca} />}
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
  <button data-gc="descoberta.explorar.button.on-escolher"
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
      <div data-gc="descoberta.explorar.div--8" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton data-gc="descoberta.explorar.skeleton" key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );

  if (!comunidades.length)
    return (
      <div data-gc="descoberta.explorar.div--9" className="flex flex-col items-center gap-3 py-20 text-center">
        <Compass data-gc="descoberta.explorar.compass" size={36} className="text-ink-faint" />
        <div data-gc="descoberta.explorar.div--10">
          <p data-gc="descoberta.explorar.p" className="text-sm font-medium">
            {termo ? "Nenhuma comunidade com esse nome" : "Ainda não há o que explorar"}
          </p>
          <p data-gc="descoberta.explorar.p--2" className="mt-1 max-w-sm text-xs text-ink-faint">
            {termo
              ? "Tente outro termo, ou tire o filtro de categoria."
              : `Só entram aqui as comunidades a partir de ${MEMBROS_PARA_DESCOBRIR} membros. Assim que uma chegar lá, ela aparece sozinha.`}
          </p>
        </div>
      </div>
    );

  return (
    <div data-gc="descoberta.explorar.div--11" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {comunidades.map((comunidade) => (
        <CartaoDeComunidade data-gc="descoberta.explorar.cartao-de-comunidade"
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
