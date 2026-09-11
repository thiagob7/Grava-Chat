import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Compass, LayoutGrid, Menu, Palette, Search, Users, X } from "lucide-react";
import {
  APP_CATEGORIES,
  COMMUNITY_CATEGORIES,
  type AppDiscovered,
  MEMBERS_FOR_DISCOVER,
  CATEGORY_NAMES,
  type CommunityCategory,
  type CommunityDiscovery,
} from "@gravae/shared";

import {
  useApps,
  useCommunities,
  useJoinCommunity,
  useGalleryThemes,
} from "~/@core/application/queries/descoberta/use-descoberta";
import { useFindFriends } from "~/@core/application/queries/friend/use-find-friends";
import { useLogout } from "~/@core/application/queries/auth/use-logout";
import { useSession } from "~/contexts/session-context";
import { bareField, fieldGroup } from "~/components/ui/input";
import { WidthHandle, useResizableWidth } from "~/components/ui/resizable";
import { Sheet, SheetContent, SheetTitle } from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { CommunityModal } from "~/features/descoberta/components/ComunidadeModal";
import { AppCard } from "~/features/descoberta/components/CartaoDeAplicativo";
import { AppPublic } from "~/pages/presentation/bot/AplicativoPublico";
import { CommunityCard } from "~/features/descoberta/components/CartaoDeComunidade";
import { ThemeGalleryCard } from "~/features/descoberta/components/CartaoDeTema";
import { useImportTheme } from "~/features/tema/stores/importar-tema";
import { LeftColumn } from "~/features/app/components/ColunaDaEsquerda";
import { BrandBackground } from "~/features/app/components/FundoDaMarca";
import { BarFooter } from "~/features/app/components/RodapeDaBarra";
import { useTranslation } from "~/traducao";
import { GuildRail } from "~/features/servidor/components/GuildRail";
import { useDelay } from "~/hooks/use-atraso";
import { useScreenNarrow } from "~/hooks/use-tela-estreita";
import { cn } from "~/lib/utils";
import { flx, flxAttr, flxCls } from "~/lib/compat-de-tema";

type Tab = "comunidades" | "aplicativos" | "temas";

const TABS: { id: Tab; name: string; icon: React.ElementType }[] = [
  { id: "comunidades", name: "Comunidades", icon: Users },
  { id: "aplicativos", name: "Aplicativos", icon: LayoutGrid },
  { id: "temas", name: "Temas", icon: Palette },
];

const LOOKUP: Record<Tab, string> = {
  comunidades: "Buscar comunidades",
  aplicativos: "Buscar aplicativos",
  temas: "Buscar temas",
};

export const Explore: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const screenNarrow = useScreenNarrow();
  const { data: relations = [] } = useFindFriends(true);
  const { user, endSession } = useSession();
  const logout = useLogout();

  const leave = async () => {
    await logout.mutateAsync().catch(() => undefined);
    endSession();
  };

  const { width, dragging, handle, bounds } = useResizableWidth("explore", {
    initial: 320,
    token: "--layout-sidebar-width",
    min: 180,
    max: 420,
    edge: "right",
  });

  const { botId } = useParams<{ botId: string }>();
  const [tab, setTab] = useState<Tab>(botId ? "aplicativos" : "comunidades");
  const [category, setCategory] = useState<CommunityCategory | null>(null);
  const [appCategory, setAppCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [menuIsOpen, setMenuIsOpen] = useState(false);

  const pending = relations.filter((r) => r.status === "PENDING_IN").length;

  const navigation = (
    <LeftColumn data-gc="descoberta.explorar.left-column"
      footer={<BarFooter data-gc="descoberta.explorar.bar-footer" user={user} onLogout={() => void leave()} />}
      alca={
        <WidthHandle data-gc="descoberta.explorar.width-handle"
          edge="right"
          dragging={dragging}
          width={width}
          bounds={bounds}
          {...handle}
        />
      }
    >
      <GuildRail data-gc="descoberta.explorar.guild-rail"
        activeGuildId={null}
        onSelect={(id) => navigate(`/channels/${id}`)}
        onOpenFriends={() => navigate("/dm")}
        pendingFriendRequests={pending}
      />

      <aside data-gc="descoberta.explorar.aside"
        className="group/coluna canto-do-miolo topo-do-miolo relative flex shrink-0 flex-col bg-surface-1"
        style={{ width: width }}
      >
        <div data-gc="descoberta.explorar.div" aria-hidden {...flx("sideDivider", "absolute inset-y-0 right-0 w-px bg-transparent")} />
        <div data-gc="descoberta.explorar.div--2" {...flx("listChats", "lista-de-comunidades miolo-recortado flex min-h-0 flex-1 flex-col")}>
        <header data-gc="descoberta.explorar.header" {...flx("channelTop", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor shadow-sm")}>
          <div data-gc="descoberta.explorar.div--3"
            {...flx("topChannelCore", "flex h-full w-full items-center px-4")}
          >
            <h1 data-gc="descoberta.explorar.h1" className="truncate font-semibold">Explorar</h1>
          </div>
        </header>

        <nav data-gc="descoberta.explorar.nav" {...flxAttr("exploreNavigation")} className="flex flex-col gap-0.5 px-2 py-3">
          {TABS.map((item) => (
            <button data-gc="descoberta.explorar.button"
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setSearch("");
                setMenuIsOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition",
                tab === item.id
                  ? "bg-selecionado text-ink"
                  : "text-ink-muted hover:bg-hover hover:text-ink",
              )}
            >
              <item.icon data-gc="descoberta.explorar.itemicon" size={18} className="shrink-0" />
              <span data-gc="descoberta.explorar.span" className="min-w-0 flex-1 truncate font-medium">{item.name}</span>

            </button>
          ))}
        </nav>

        <div data-gc="descoberta.explorar.div--4" className="mt-auto" />
        </div>

      </aside>
    </LeftColumn>
  );

  return (
    <div data-gc="descoberta.explorar.div--5" className="flex h-full bg-surface-0">
      {screenNarrow ? (
        <Sheet data-gc="descoberta.explorar.sheet.set-menu-is-open" open={menuIsOpen} onOpenChange={setMenuIsOpen}>
          <SheetContent data-gc="descoberta.explorar.sheet-content" className="inset-y-0 left-0 right-auto w-[19rem] max-w-[85vw] flex-row p-0">
            <SheetTitle data-gc="descoberta.explorar.sheet-title" className="sr-only">Explorar</SheetTitle>
            {navigation}
          </SheetContent>
        </Sheet>
      ) : (
        navigation
      )}

      <div data-gc="descoberta.explorar.div--6" {...flx("explore", "topo-do-miolo flex min-w-0 flex-1 flex-col")}>
        <header data-gc="descoberta.explorar.header--2" {...flx("channelTop", "topo-do-canal regiao-de-arrasto h-[var(--layout-header-height)] shrink-0 border-b border-divisor bg-surface-2")}>
          <div data-gc="descoberta.explorar.div--7"
            {...flx("topChannelCore", "flex h-full w-full items-center gap-3 px-4")}
          >
            {screenNarrow && (
              <button data-gc="descoberta.explorar.button--2"
                onClick={() => setMenuIsOpen(true)}
                aria-label="Abrir o Explorar"
                className="rounded p-1 text-ink-faint transition hover:text-ink"
              >
                <Menu data-gc="descoberta.explorar.menu" size={20} />
              </button>
            )}

            <div data-gc="descoberta.explorar.div--8" className="regiao-sem-arrasto flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
              {botId && (
                <button data-gc="descoberta.explorar.button--3"
                  type="button"
                  onClick={() => navigate("/explorar")}
                  className="flex shrink-0 items-center gap-1.5 rounded px-2 py-1 text-sm text-ink-muted transition hover:bg-surface-3 hover:text-ink"
                >
                  <ArrowLeft data-gc="descoberta.explorar.arrow-left" size={16} /> {t("servidor.descoberta.voltarParaExplorar")}
                </button>
              )}

              {!botId && tab === "comunidades" && (
                <>
              <Filter data-gc="descoberta.explorar.filter"
                active={category === null}
                name="Todos"
                onPick={() => setCategory(null)}
              />

              {COMMUNITY_CATEGORIES.map((id) => (
                <Filter data-gc="descoberta.explorar.filter--2"
                  key={id}
                  active={category === id}
                  name={CATEGORY_NAMES[id]}
                  onPick={() => setCategory(id)}
                />
              ))}
                </>
              )}

              {!botId && tab === "aplicativos" && (
                <>
                  <Filter data-gc="descoberta.explorar.filter--3"
                    active={appCategory === null}
                    name="Todos"
                    onPick={() => setAppCategory(null)}
                  />

                  {APP_CATEGORIES.map((id) => (
                    <Filter data-gc="descoberta.explorar.filter--4"
                      key={id}
                      active={appCategory === id}
                      name={t(`servidor.descoberta.categoria.${id}`)}
                      onPick={() => setAppCategory(id)}
                    />
                  ))}
                </>
              )}
            </div>

            {!botId && (
            <div data-gc="descoberta.explorar.div--9" className={cn(fieldGroup, "regiao-sem-arrasto h-8 w-56 shrink-0")}>
              <Search data-gc="descoberta.explorar.search" size={14} className="shrink-0 text-ink-faint" />
              <input data-gc="descoberta.explorar.input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={LOOKUP[tab]}
                aria-label={LOOKUP[tab]}
                className={cn(bareField, flxCls("discoveryField"))}
              />
              {search && (
                <button data-gc="descoberta.explorar.button--4"
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Limpar a busca"
                  className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
                >
                  <X data-gc="descoberta.explorar.x" size={14} />
                </button>
              )}
            </div>
            )}
          </div>
        </header>

        <div data-gc="descoberta.explorar.div--10" className="min-h-0 flex-1 overflow-y-auto">
          {botId ? (
            <div data-gc="descoberta.explorar.div--11" className="p-5">
              <AppPublic data-gc="descoberta.explorar.app-public" botId={botId} />
            </div>
          ) : tab === "aplicativos" ? (
            <Apps data-gc="descoberta.explorar.apps" search={search} category={appCategory} />
          ) : (
            tab === "comunidades" ? (
              <Communities data-gc="descoberta.explorar.communities" category={category} search={search} />
            ) : (
              <div data-gc="descoberta.explorar.div--12" className="p-5">
                <Themes data-gc="descoberta.explorar.themes" search={search} />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const Filter: React.FC<{ active: boolean; name: string; onPick: () => void }> = ({
  active,
  name,
  onPick,
}) => (
  <button data-gc="descoberta.explorar.button.on-pick"
    type="button"
    onClick={onPick}
    className={cn(
      "shrink-0 rounded px-3 py-1.5 text-sm font-medium transition",
      active ? "bg-selecionado text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
    )}
  >
    {name}
  </button>
);

const CommunitiesHero: React.FC<{ title?: string }> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div data-gc="descoberta.explorar.div--13" className="relative isolate overflow-hidden">
      <BrandBackground data-gc="descoberta.explorar.brand-background" className="pointer-events-none absolute inset-0" />

      <div data-gc="descoberta.explorar.div--14"
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(0 0 0 / 0.5), rgb(0 0 0 / 0.18) 46%, transparent 72%)",
        }}
      />

      <div data-gc="descoberta.explorar.div--15" className="relative px-6 py-11 sm:px-10 sm:py-14">
        <h2 data-gc="descoberta.explorar.h2" className="max-w-xl text-[1.75rem] font-black uppercase leading-[1.05] tracking-tight text-sobre-marca sm:text-[2.125rem]">
          {title ?? t("servidor.descoberta.heroComunidades")}
        </h2>
        <p data-gc="descoberta.explorar.p" className="mt-3 max-w-md text-sm leading-relaxed text-sobre-marca opacity-90">
          {t("servidor.descoberta.heroComunidadesDetalhe")}
        </p>
      </div>
    </div>
  );
};

const CommunitiesTrack: React.FC<{
  title: string | null;
  communities: CommunityDiscovery[];
  onDetails: (community: CommunityDiscovery) => void;
}> = ({ title, communities, onDetails }) => (
  <section data-gc="descoberta.explorar.section">
    {title && <h3 data-gc="descoberta.explorar.h3" className="mb-4 text-lg font-bold">{title}</h3>}

    <AppsGrid data-gc="descoberta.explorar.apps-grid">
      {communities.map((community) => (
        <CommunityCard data-gc="descoberta.explorar.community-card"
          key={community.id}
          community={community}
          onDetails={() => onDetails(community)}
        />
      ))}
    </AppsGrid>
  </section>
);

const Communities: React.FC<{ category: CommunityCategory | null; search: string }> = ({
  category,
  search,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const join = useJoinCommunity();
  const [picked, setPicked] = useState<CommunityDiscovery | null>(null);

  const term = useDelay(search.trim());
  const filtering = Boolean(term || category);
  const heroTitle = category ? CATEGORY_NAMES[category] : undefined;

  const joinAt = (community: CommunityDiscovery) =>
    join.mutate(community.id, {
      onSuccess: ({ guildId }) => {
        setPicked(null);
        navigate(`/channels/${guildId}`);
      },
    });

  const { data: communities, isLoading } = useCommunities({
    category: category ?? undefined,
    search: term || undefined,
  });

  const tracks = React.useMemo(() => {
    if (!communities || filtering) return [];

    const used = new Set<string>();

    const byCategory = COMMUNITY_CATEGORIES.map((id) => {
      const hers = communities.filter((c) => c.category === id);
      hers.forEach((c) => used.add(c.id));

      return { key: id as string, title: CATEGORY_NAMES[id], items: hers };
    }).filter((track) => track.items.length);

    const loose = communities.filter((c) => !used.has(c.id));

    return loose.length
      ? [
          ...byCategory,
          { key: "todas", title: t("servidor.descoberta.todasAsComunidades"), items: loose },
        ]
      : byCategory;
  }, [communities, filtering, t]);

  const highlights =
    !filtering && communities
      ? communities.filter((c) => c.verified).slice(0, 4)
      : [];

  const modal = (
    <CommunityModal data-gc="descoberta.explorar.community-modal.join-at"
      community={picked}
      joining={join.isPending && join.variables === picked?.id}
      onClose={() => setPicked(null)}
      onJoin={joinAt}
      onOpen={(community) => navigate(`/channels/${community.id}`)}
    />
  );

  if (isLoading || !communities)
    return (
      <div data-gc="descoberta.explorar.div--16" className="p-5">
        <AppsGrid data-gc="descoberta.explorar.apps-grid--2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton data-gc="descoberta.explorar.skeleton" key={i} className="h-60 rounded-xl" />
          ))}
        </AppsGrid>
      </div>
    );

  if (!communities.length)
    return (
      <>
        {!term && <CommunitiesHero data-gc="descoberta.explorar.communities-hero" title={heroTitle} />}

        <div data-gc="descoberta.explorar.div--17" className="flex flex-col items-center gap-3 py-20 text-center">
          <Compass data-gc="descoberta.explorar.compass" size={36} className="text-ink-faint" />
          <div data-gc="descoberta.explorar.div--18">
            <p data-gc="descoberta.explorar.p--2" className="text-sm font-medium">
              {term ? "Nenhuma comunidade com esse nome" : "Ainda não há o que explorar"}
            </p>
            <p data-gc="descoberta.explorar.p--3" className="mt-1 max-w-sm text-xs text-ink-faint">
              {term
                ? "Tente outro termo, ou tire o filtro de categoria."
                : `Só entram aqui as comunidades a partir de ${MEMBERS_FOR_DISCOVER} membros, e as verificadas pela casa. Assim que uma chegar lá, ela aparece sozinha.`}
            </p>
          </div>
        </div>

        {modal}
      </>
    );

  return (
    <>
      {!term && <CommunitiesHero data-gc="descoberta.explorar.communities-hero--2" title={heroTitle} />}

      <div data-gc="descoberta.explorar.div--19" className="flex flex-col gap-10 p-5">
        {filtering ? (
          <CommunitiesTrack data-gc="descoberta.explorar.communities-track.set-picked"
            title={null}
            communities={communities}
            onDetails={setPicked}
          />
        ) : (
          <>
            {highlights.length > 0 && (
              <CommunitiesTrack data-gc="descoberta.explorar.communities-track.set-picked--2"
                title={t("servidor.descoberta.emDestaque")}
                communities={highlights}
                onDetails={setPicked}
              />
            )}

            {tracks.map((track) => (
              <CommunitiesTrack data-gc="descoberta.explorar.communities-track.set-picked--3"
                key={track.key}
                title={tracks.length === 1 && track.key === "todas" ? null : track.title}
                communities={track.items}
                onDetails={setPicked}
              />
            ))}
          </>
        )}
      </div>

      {modal}
    </>
  );
};

const Grid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="descoberta.explorar.div--20" className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-4">{children}</div>
);

const Empty: React.FC<{ icon: React.ElementType; title: string; detail: string }> = ({
  icon: Icon,
  title,
  detail,
}) => (
  <div data-gc="descoberta.explorar.div--21" className="flex flex-col items-center gap-3 py-20 text-center">
    <Icon data-gc="descoberta.explorar.icon" size={36} className="text-ink-faint" />
    <div data-gc="descoberta.explorar.div--22">
      <p data-gc="descoberta.explorar.p--4" className="text-sm font-medium">{title}</p>
      <p data-gc="descoberta.explorar.p--5" className="mt-1 max-w-sm text-xs text-ink-faint">{detail}</p>
    </div>
  </div>
);

const Loading: React.FC = () => (
  <Grid data-gc="descoberta.explorar.grid">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton data-gc="descoberta.explorar.skeleton--2" key={i} className="h-56 rounded-lg" />
    ))}
  </Grid>
);

const Themes: React.FC<{ search: string }> = ({ search }) => {
  const term = useDelay(search.trim());
  const openImport = useImportTheme((s) => s.open);
  const { data: themes, isLoading } = useGalleryThemes(term);

  if (isLoading || !themes) return <Loading data-gc="descoberta.explorar.loading" />;

  if (!themes.length)
    return (
      <Empty data-gc="descoberta.explorar.empty"
        icon={Palette}
        title={term ? "Nenhum tema com esse nome" : "Ainda não há tema publicado"}
        detail={
          term
            ? "Tente outro termo, ou procure por uma das etiquetas do tema."
            : "Todo tema publicado no estúdio aparece aqui, para qualquer um importar."
        }
      />
    );

  return (
    <Grid data-gc="descoberta.explorar.grid--2">
      {themes.map((theme) => (
        <ThemeGalleryCard data-gc="descoberta.explorar.theme-gallery-card"
          key={theme.id}
          theme={theme}
          onImport={() => openImport(theme.id)}
        />
      ))}
    </Grid>
  );
};

const AppsGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="descoberta.explorar.div--23" className="grid grid-cols-[repeat(auto-fill,minmax(16rem,1fr))] gap-4">
    {children}
  </div>
);

const HeroDeApps: React.FC<{ title?: string }> = ({ title }) => {
  const { t } = useTranslation();

  return (
    <div data-gc="descoberta.explorar.div--24" className="relative isolate overflow-hidden">
      <BrandBackground data-gc="descoberta.explorar.brand-background--2" className="pointer-events-none absolute inset-0" />

      <div data-gc="descoberta.explorar.div--25"
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgb(0 0 0 / 0.5), rgb(0 0 0 / 0.18) 46%, transparent 72%)",
        }}
      />

      <div data-gc="descoberta.explorar.div--26" className="relative px-6 py-11 sm:px-10 sm:py-14">
        <h2 data-gc="descoberta.explorar.h2--2" className="max-w-xl text-[1.75rem] font-black uppercase leading-[1.05] tracking-tight text-sobre-marca sm:text-[2.125rem]">
          {title ?? t("servidor.descoberta.heroTitulo")}
        </h2>
        <p data-gc="descoberta.explorar.p--6" className="mt-3 max-w-md text-sm leading-relaxed text-sobre-marca opacity-90">
          {t("servidor.descoberta.heroDetalhe")}
        </p>
      </div>
    </div>
  );
};

const AppsTrack: React.FC<{
  title: string | null;
  apps: AppDiscovered[];
  onOpen: (id: string) => void;
}> = ({ title, apps, onOpen }) => (
  <section data-gc="descoberta.explorar.section--2">
    {title && <h3 data-gc="descoberta.explorar.h3--2" className="mb-4 text-lg font-bold">{title}</h3>}

    <AppsGrid data-gc="descoberta.explorar.apps-grid--3">
      {apps.map((app) => (
        <AppCard data-gc="descoberta.explorar.app-card"
          key={app.id}
          app={app}
          onOpen={() => onOpen(app.id)}
        />
      ))}
    </AppsGrid>
  </section>
);

const Apps: React.FC<{ search: string; category: string | null }> = ({
  search,
  category,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const term = useDelay(search.trim());
  const { data: apps, isLoading } = useApps(term, category ?? "");

  const filtering = Boolean(term || category);
  const heroTitle = category
    ? t(`servidor.descoberta.categoria.${category}`)
    : undefined;

  const tracks = React.useMemo(() => {
    if (!apps || filtering) return [];

    const used = new Set<string>();

    const byCategory = APP_CATEGORIES.map((id) => {
      const hers = apps.filter((app) => app.categories.includes(id));
      hers.forEach((app) => used.add(app.id));

      return { key: id, title: t(`servidor.descoberta.categoria.${id}`), items: hers };
    }).filter((track) => track.items.length);

    const loose = apps.filter((app) => !used.has(app.id));

    return loose.length
      ? [
          ...byCategory,
          { key: "todos", title: t("servidor.descoberta.todosOsApps"), items: loose },
        ]
      : byCategory;
  }, [apps, filtering, t]);

  const news =
    !filtering && apps && apps.length >= 5 ? apps.slice(0, 4) : [];

  const open = (id: string) => navigate(`/apps/${id}`);

  if (isLoading || !apps) {
    return (
      <div data-gc="descoberta.explorar.div--27" className="p-5">
        <AppsGrid data-gc="descoberta.explorar.apps-grid--4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton data-gc="descoberta.explorar.skeleton--3" key={i} className="h-60 rounded-xl" />
          ))}
        </AppsGrid>
      </div>
    );
  }

  if (!apps.length)
    return (
      <>
        {!term && <HeroDeApps data-gc="descoberta.explorar.hero-de-apps" title={heroTitle} />}
        <Empty data-gc="descoberta.explorar.empty--2"
          icon={LayoutGrid}
          title={term ? "Nenhum aplicativo com esse nome" : "Ainda não há aplicativo aberto"}
          detail={
            term
              ? "Tente outro termo."
              : "Só aparecem aqui os aplicativos abertos, que qualquer um pode adicionar ao servidor onde manda."
          }
        />
      </>
    );

  return (
    <>
      {!term && <HeroDeApps data-gc="descoberta.explorar.hero-de-apps--2" title={heroTitle} />}

      <div data-gc="descoberta.explorar.div--28" className="flex flex-col gap-10 p-5">
        {filtering ? (
          <AppsGrid data-gc="descoberta.explorar.apps-grid--5">
            {apps.map((app) => (
              <AppCard data-gc="descoberta.explorar.app-card--2"
                key={app.id}
                app={app}
                onOpen={() => open(app.id)}
              />
            ))}
          </AppsGrid>
        ) : (
          <>
            {news.length > 0 && (
              <AppsTrack data-gc="descoberta.explorar.apps-track.open"
                title={t("servidor.descoberta.novidades")}
                apps={news}
                onOpen={open}
              />
            )}

            {tracks.map((track) => (
              <AppsTrack data-gc="descoberta.explorar.apps-track.open--2"
                key={track.key}
                title={tracks.length === 1 && track.key === "todos" ? null : track.title}
                apps={track.items}
                onOpen={open}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};
