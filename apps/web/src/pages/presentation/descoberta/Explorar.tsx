import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Compass, LayoutGrid, Menu, Palette, Search, Users, X } from "lucide-react";
import {
  CATEGORIAS_DE_COMUNIDADE,
  MEMBROS_PARA_DESCOBRIR,
  NOMES_DE_CATEGORIA,
  type CategoriaDeComunidade,
  type ComunidadeDescoberta,
} from "@gravae/shared";

import {
  useAplicativos,
  useComunidades,
  useEntrarNaComunidade,
  useTemasDaGaleria,
} from "~/@core/application/queries/descoberta/use-descoberta";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { useSession } from "~/contexts/session-context";
import { bareField, fieldGroup } from "~/components/ui/input";
import { WidthHandle, useResizableWidth } from "~/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { ComunidadeModal } from "~/features/descoberta/components/ComunidadeModal";
import { CartaoDeAplicativo } from "~/features/descoberta/components/CartaoDeAplicativo";
import { CartaoDeComunidade } from "~/features/descoberta/components/CartaoDeComunidade";
import { CartaoDeTemaDaGaleria } from "~/features/descoberta/components/CartaoDeTema";
import { useImportarTema } from "~/features/tema/stores/importar-tema";
import { ColunaDaEsquerda } from "~/features/app/components/ColunaDaEsquerda";
import { RodapeDaBarra } from "~/features/app/components/RodapeDaBarra";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { useAtraso } from "~/hooks/use-atraso";
import { useTelaEstreita } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

type Aba = "comunidades" | "aplicativos" | "temas";

const ABAS: { id: Aba; nome: string; icone: React.ElementType }[] = [
  { id: "comunidades", nome: "Comunidades", icone: Users },
  { id: "aplicativos", nome: "Aplicativos", icone: LayoutGrid },
  { id: "temas", nome: "Temas", icone: Palette },
];

const PROCURAR: Record<Aba, string> = {
  comunidades: "Buscar comunidades",
  aplicativos: "Buscar aplicativos",
  temas: "Buscar temas",
};

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

  const { width, dragging, handle, bounds } = useResizableWidth("explorar", {
    initial: 320,
    token: "--layout-sidebar-width",
    min: 180,
    max: 420,
    edge: "right",
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
        className="canto-do-miolo topo-do-miolo relative flex shrink-0 flex-col bg-surface-1"
        style={{ width: width }}
      >
        <div data-gc="descoberta.explorar.div" aria-hidden {...flx("divisorDaLateral", "absolute inset-y-0 right-0 w-px bg-divisor")} />
        <div data-gc="descoberta.explorar.div--2" {...flx("listaDeConversas", "lista-de-comunidades miolo-recortado flex min-h-0 flex-1 flex-col")}>
        <header data-gc="descoberta.explorar.header" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor shadow-sm")}>
          <div data-gc="descoberta.explorar.div--3"
            {...flx("mioloDoTopoDoCanal", "flex h-full w-full items-center px-4")}
          >
            <h1 data-gc="descoberta.explorar.h1" className="truncate font-semibold">Explorar</h1>
          </div>
        </header>

        <nav data-gc="descoberta.explorar.nav" {...flxAttr("navegacaoDoExplorar")} className="flex flex-col gap-0.5 px-2 py-3">
          {ABAS.map((item) => (
            <button data-gc="descoberta.explorar.button"
              key={item.id}
              type="button"
              onClick={() => {
                setAba(item.id);
                setBusca("");
                setMenuAberto(false);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition",
                aba === item.id
                  ? "bg-selecionado text-ink"
                  : "text-ink-muted hover:bg-hover hover:text-ink",
              )}
            >
              <item.icone data-gc="descoberta.explorar.itemicone" size={18} className="shrink-0" />
              <span data-gc="descoberta.explorar.span" className="min-w-0 flex-1 truncate font-medium">{item.nome}</span>

            </button>
          ))}
        </nav>

        <div data-gc="descoberta.explorar.div--4" className="mt-auto" />
        </div>

        <WidthHandle data-gc="descoberta.explorar.width-handle"
          edge="right"
          dragging={dragging}
          width={width}
          bounds={bounds}
          {...handle}
        />
      </aside>
    </ColunaDaEsquerda>
  );

  return (
    <div data-gc="descoberta.explorar.div--5" className="flex h-full bg-surface-0">
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

      <div data-gc="descoberta.explorar.div--6" {...flx("explorar", "topo-do-miolo flex min-w-0 flex-1 flex-col")}>
        <header data-gc="descoberta.explorar.header--2" {...flx("topoDoCanal", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor bg-surface-2")}>
          <div data-gc="descoberta.explorar.div--7"
            {...flx("mioloDoTopoDoCanal", "flex h-full w-full items-center gap-3 px-4")}
          >
            {telaEstreita && (
              <button data-gc="descoberta.explorar.button--2"
                onClick={() => setMenuAberto(true)}
                aria-label="Abrir o Explorar"
                className="rounded p-1 text-ink-faint transition hover:text-ink"
              >
                <Menu data-gc="descoberta.explorar.menu" size={20} />
              </button>
            )}

            <div data-gc="descoberta.explorar.div--8" className="regiao-sem-arrasto flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {aba === "comunidades" && (
                <>
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
                </>
              )}
            </div>

            <div data-gc="descoberta.explorar.div--9" className={cn(fieldGroup, "regiao-sem-arrasto h-8 w-56 shrink-0")}>
              <Search data-gc="descoberta.explorar.search" size={14} className="shrink-0 text-ink-faint" />
              <input data-gc="descoberta.explorar.input"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder={PROCURAR[aba]}
                aria-label={PROCURAR[aba]}
                className={cn(bareField, flxCls("campoDaDescoberta"))}
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
          </div>
        </header>

        <div data-gc="descoberta.explorar.div--10" className="min-h-0 flex-1 overflow-y-auto p-5">
          {aba === "comunidades" && <Comunidades data-gc="descoberta.explorar.comunidades" categoria={categoria} busca={busca} />}
          {aba === "aplicativos" && <Aplicativos data-gc="descoberta.explorar.aplicativos" busca={busca} />}
          {aba === "temas" && <Temas data-gc="descoberta.explorar.temas" busca={busca} />}
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
  const [escolhida, setEscolhida] = useState<ComunidadeDescoberta | null>(null);

  const termo = useAtraso(busca.trim());

  const entrarEm = (comunidade: ComunidadeDescoberta) =>
    entrar.mutate(comunidade.id, {
      onSuccess: ({ guildId }) => {
        setEscolhida(null);
        navigate(`/channels/${guildId}`);
      },
    });

  const { data: comunidades, isLoading } = useComunidades({
    categoria: categoria ?? undefined,
    busca: termo || undefined,
  });

  if (isLoading || !comunidades)
    return (
      <div data-gc="descoberta.explorar.div--11" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton data-gc="descoberta.explorar.skeleton" key={i} className="h-64 rounded-lg" />
        ))}
      </div>
    );

  if (!comunidades.length)
    return (
      <div data-gc="descoberta.explorar.div--12" className="flex flex-col items-center gap-3 py-20 text-center">
        <Compass data-gc="descoberta.explorar.compass" size={36} className="text-ink-faint" />
        <div data-gc="descoberta.explorar.div--13">
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
    <div data-gc="descoberta.explorar.div--14" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">
      {comunidades.map((comunidade) => (
        <CartaoDeComunidade data-gc="descoberta.explorar.cartao-de-comunidade"
          key={comunidade.id}
          comunidade={comunidade}
          entrando={entrar.isPending && entrar.variables === comunidade.id}
          onAbrir={() => navigate(`/channels/${comunidade.id}`)}
          onEntrar={() => entrarEm(comunidade)}
          onDetalhes={() => setEscolhida(comunidade)}
        />
      ))}

      <ComunidadeModal data-gc="descoberta.explorar.comunidade-modal.entrar-em"
        comunidade={escolhida}
        entrando={entrar.isPending && entrar.variables === escolhida?.id}
        onFechar={() => setEscolhida(null)}
        onEntrar={entrarEm}
        onAbrir={(comunidade) => navigate(`/channels/${comunidade.id}`)}
      />
    </div>
  );
};

const Grade: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="descoberta.explorar.div--15" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">{children}</div>
);

const Vazio: React.FC<{ icone: React.ElementType; titulo: string; detalhe: string }> = ({
  icone: Icone,
  titulo,
  detalhe,
}) => (
  <div data-gc="descoberta.explorar.div--16" className="flex flex-col items-center gap-3 py-20 text-center">
    <Icone data-gc="descoberta.explorar.icone" size={36} className="text-ink-faint" />
    <div data-gc="descoberta.explorar.div--17">
      <p data-gc="descoberta.explorar.p--3" className="text-sm font-medium">{titulo}</p>
      <p data-gc="descoberta.explorar.p--4" className="mt-1 max-w-sm text-xs text-ink-faint">{detalhe}</p>
    </div>
  </div>
);

const Carregando: React.FC = () => (
  <Grade data-gc="descoberta.explorar.grade">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton data-gc="descoberta.explorar.skeleton--2" key={i} className="h-56 rounded-lg" />
    ))}
  </Grade>
);

const Temas: React.FC<{ busca: string }> = ({ busca }) => {
  const termo = useAtraso(busca.trim());
  const abrirImportacao = useImportarTema((s) => s.abrir);
  const { data: temas, isLoading } = useTemasDaGaleria(termo);

  if (isLoading || !temas) return <Carregando data-gc="descoberta.explorar.carregando" />;

  if (!temas.length)
    return (
      <Vazio data-gc="descoberta.explorar.vazio"
        icone={Palette}
        titulo={termo ? "Nenhum tema com esse nome" : "Ainda não há tema publicado"}
        detalhe={
          termo
            ? "Tente outro termo, ou procure por uma das etiquetas do tema."
            : "Todo tema publicado no estúdio aparece aqui, para qualquer um importar."
        }
      />
    );

  return (
    <Grade data-gc="descoberta.explorar.grade--2">
      {temas.map((tema) => (
        <CartaoDeTemaDaGaleria data-gc="descoberta.explorar.cartao-de-tema-da-galeria"
          key={tema.id}
          tema={tema}
          onImportar={() => abrirImportacao(tema.id)}
        />
      ))}
    </Grade>
  );
};

const Aplicativos: React.FC<{ busca: string }> = ({ busca }) => {
  const navigate = useNavigate();
  const termo = useAtraso(busca.trim());
  const { data: aplicativos, isLoading } = useAplicativos(termo);

  if (isLoading || !aplicativos) return <Carregando data-gc="descoberta.explorar.carregando--2" />;

  if (!aplicativos.length)
    return (
      <Vazio data-gc="descoberta.explorar.vazio--2"
        icone={LayoutGrid}
        titulo={termo ? "Nenhum aplicativo com esse nome" : "Ainda não há aplicativo aberto"}
        detalhe={
          termo
            ? "Tente outro termo."
            : "Só aparecem aqui os aplicativos abertos, que qualquer um pode adicionar ao servidor onde manda."
        }
      />
    );

  return (
    <Grade data-gc="descoberta.explorar.grade--3">
      {aplicativos.map((aplicativo) => (
        <CartaoDeAplicativo data-gc="descoberta.explorar.cartao-de-aplicativo"
          key={aplicativo.id}
          aplicativo={aplicativo}
          onAdicionar={() => navigate(`/bots/${aplicativo.id}/adicionar`)}
        />
      ))}
    </Grade>
  );
};
