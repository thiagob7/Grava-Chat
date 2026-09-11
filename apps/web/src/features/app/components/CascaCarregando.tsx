import React from "react";

import { LeftColumn } from "~/features/app/components/ColunaDaEsquerda";
import { Skeleton, lineWidth } from "~/components/ui/skeleton";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";

const SERVERS = 7;

const CHANNELS_BY_GROUP = [4, 3, 5];

const MESSAGES = 8;

const MEMBERS = 9;

const FooterGhost: React.FC = () => (
  <div data-gc="app.casca-carregando.div"
    {...flx(
      "userArea",
      "flex h-14 shrink-0 items-center gap-2 border-t border-divisor bg-surface-1 px-2",
    )}
  >
    <Skeleton data-gc="app.casca-carregando.skeleton" className="size-8 shrink-0 rounded-full" />

    <div data-gc="app.casca-carregando.div--2" className="min-w-0 flex-1 space-y-1.5">
      <Skeleton data-gc="app.casca-carregando.skeleton--2" className="h-2.5 w-20 rounded-sm" />
      <Skeleton data-gc="app.casca-carregando.skeleton--3" className="h-2 w-14 rounded-sm" />
    </div>

    {Array.from({ length: 3 }, (_, i) => (
      <Skeleton data-gc="app.casca-carregando.skeleton--4" key={i} className="size-7 shrink-0 rounded" />
    ))}
  </div>
);

export const ShellLoading: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div data-gc="app.casca-carregando.div--3"
      aria-busy
      aria-label={t("comum.carregando")}
      {...flx("appLine", "flex h-full bg-surface-0")}
    >
      <div data-gc="app.casca-carregando.div--4" className="hidden md:flex">
        <LeftColumn data-gc="app.casca-carregando.left-column" footer={<FooterGhost data-gc="app.casca-carregando.footer-ghost" />}>
          <nav data-gc="app.casca-carregando.nav"
            {...flx(
              "serversRail",
              "trilho-de-servidores flex w-[var(--layout-guild-list-width)] shrink-0 flex-col items-center gap-2 overflow-hidden bg-surface-1 pt-3",
            )}
          >
            <Skeleton data-gc="app.casca-carregando.skeleton--5" className="size-12 shrink-0 rounded-2xl" />

            <div data-gc="app.casca-carregando.div--5" className="my-1 h-0.5 w-8 rounded-full bg-surface-3" />

            {Array.from({ length: SERVERS }, (_, i) => (
              <Skeleton data-gc="app.casca-carregando.skeleton--6" key={i} className="size-12 shrink-0 rounded-full" />
            ))}
          </nav>

          <aside data-gc="app.casca-carregando.aside" className="group/coluna canto-do-miolo topo-do-miolo relative flex w-[var(--layout-sidebar-width)] shrink-0 flex-col bg-surface-1">
            <div data-gc="app.casca-carregando.div--6" aria-hidden {...flx("sideDivider", "absolute inset-y-0 right-0 w-px bg-transparent")} />
            <div data-gc="app.casca-carregando.div--7"
              {...flx(
                "listChannels",
                "lista-de-canais miolo-recortado flex min-h-0 flex-1 flex-col",
              )}
            >
              <header data-gc="app.casca-carregando.header" className="flex h-[var(--layout-header-height)] shrink-0 items-center border-b border-divisor px-4">
                <Skeleton data-gc="app.casca-carregando.skeleton--7" className="h-3.5 w-32 rounded-sm" />
              </header>

              <div data-gc="app.casca-carregando.div--8"
                {...flx(
                  "channelsScroller",
                  "flex-1 overflow-hidden px-2 py-3",
                )}
              >
                {CHANNELS_BY_GROUP.map((count, group) => (
                  <div data-gc="app.casca-carregando.div--9" key={group} className="mb-4">
                    <Skeleton data-gc="app.casca-carregando.skeleton--8" className="mb-2 ml-2 h-2.5 w-20 rounded-sm" />

                    {Array.from({ length: count }, (_, i) => (
                      <div data-gc="app.casca-carregando.div--10"
                        key={i}
                        className="flex items-center gap-1.5 px-2 py-1"
                      >
                        <Skeleton data-gc="app.casca-carregando.skeleton--9" className="size-4 shrink-0 rounded-sm" />
                        <Skeleton data-gc="app.casca-carregando.skeleton--10"
                          className="h-3 rounded-sm"
                          style={{ width: lineWidth(group * 3 + i) }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </LeftColumn>
      </div>

      <div data-gc="app.casca-carregando.div--11"
        {...flx(
          "coreColumn",
          "topo-do-miolo flex min-w-0 flex-1 flex-col",
        )}
      >
        <header data-gc="app.casca-carregando.header--2"
          {...flx(
            "channelTop",
            "topo-do-canal h-[var(--layout-header-height)] shrink-0 border-b border-divisor bg-cabecalho shadow-sm",
          )}
        >
          <div data-gc="app.casca-carregando.div--12"
            {...flx("topChannelCore", "flex h-full w-full items-center gap-2 px-4")}
          >
            <Skeleton data-gc="app.casca-carregando.skeleton--11" className="size-5 shrink-0 rounded-sm" />
            <Skeleton data-gc="app.casca-carregando.skeleton--12" className="h-3.5 w-40 rounded-sm" />
          </div>
        </header>

        <main data-gc="app.casca-carregando.main" {...flx("channelFrame", "flex min-h-0 flex-1")}>
          <div data-gc="app.casca-carregando.div--13" className="flex min-w-0 flex-1 flex-col">
            <section data-gc="app.casca-carregando.section"
              {...flx(
                "messagesArea",
                "mede-a-largura min-h-0 flex-1 overflow-hidden pt-4",
              )}
            >
              {Array.from({ length: MESSAGES }, (_, i) => (
                <div data-gc="app.casca-carregando.div--14"
                  key={i}
                  className="mt-4 flex gap-x-2 px-2 @sm:gap-x-4 @sm:px-4"
                >
                  <Skeleton data-gc="app.casca-carregando.skeleton--13" className="size-10 shrink-0 rounded-full" />

                  <div data-gc="app.casca-carregando.div--15" className="min-w-0 flex-1 space-y-2 py-1">
                    <div data-gc="app.casca-carregando.div--16" className="flex items-center gap-2">
                      <Skeleton data-gc="app.casca-carregando.skeleton--14" className="h-3.5 w-28 rounded-sm" />
                      <Skeleton data-gc="app.casca-carregando.skeleton--15" className="h-2.5 w-16 rounded-sm" />
                    </div>

                    <Skeleton data-gc="app.casca-carregando.skeleton--16"
                      className="h-3 rounded-sm"
                      style={{ width: lineWidth(i) }}
                    />

                    {i % 3 !== 1 && (
                      <Skeleton data-gc="app.casca-carregando.skeleton--17"
                        className="h-3 rounded-sm"
                        style={{ width: lineWidth(i + 3) }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </section>

            <section data-gc="app.casca-carregando.section--2"
              {...flx(
                "writeBox",
                "shrink-0 px-2 pb-6 pt-2 @sm:px-4",
              )}
            >
              <Skeleton data-gc="app.casca-carregando.skeleton--18" className="h-11 w-full rounded-lg" />
            </section>
          </div>

          <aside data-gc="app.casca-carregando.aside--2"
            {...flx(
              "listMembers",
              "lista-de-membros hidden w-[var(--layout-member-list-width)] shrink-0 border-l border-divisor bg-surface-2 lg:block",
            )}
          >
            <div data-gc="app.casca-carregando.div--17" className="h-full overflow-hidden px-2 py-4">
              <Skeleton data-gc="app.casca-carregando.skeleton--19" className="mb-3 ml-2 h-2.5 w-24 rounded-sm" />

              {Array.from({ length: MEMBERS }, (_, i) => (
                <div data-gc="app.casca-carregando.div--18" key={i} className="flex items-center gap-2 px-2 py-1.5">
                  <Skeleton data-gc="app.casca-carregando.skeleton--20" className="size-8 shrink-0 rounded-full" />
                  <Skeleton data-gc="app.casca-carregando.skeleton--21"
                    className="h-3 rounded-sm"
                    style={{ width: lineWidth(i) }}
                  />
                </div>
              ))}
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};
