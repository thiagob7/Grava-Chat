"use client";

import { ArrowUpRight, BookOpen, Code2, House, List, PanelLeft, PanelLeftClose, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { DocsSearch } from "~/components/docs/BuscaDosDocs";
import { APP, GROUPS } from "~/dados/docs";

const GUIDES = [
  "/desenvolvedores/primeiro-bot",
  "/desenvolvedores/biblioteca",
  "/desenvolvedores/servidores-e-canais",
  "/desenvolvedores/webhooks",
  "/desenvolvedores/comunidade",
  "/desenvolvedores/tempo-real",
  "/desenvolvedores/comandos",
  "/desenvolvedores/moderacao",
];

const REFERENCE = [
  "/desenvolvedores/referencia",
  "/desenvolvedores/referencia/mensagem",
  "/desenvolvedores/referencia/canal",
  "/desenvolvedores/referencia/servidor",
  "/desenvolvedores/referencia/membro",
  "/desenvolvedores/referencia/cargo",
  "/desenvolvedores/referencia/moderacao",
  "/desenvolvedores/referencia/expressao",
  "/desenvolvedores/referencia/voz",
  "/desenvolvedores/referencia/aplicativo",
  "/desenvolvedores/referencia/webhook",
  "/desenvolvedores/referencia/convite",
  "/desenvolvedores/referencia/auditoria",
  "/desenvolvedores/eventos",
  "/desenvolvedores/erros",
  "/desenvolvedores/limites",
  "/desenvolvedores/mudancas",
  "/desenvolvedores/politicas",
  "/desenvolvedores/temas",
];

const TABS = [
  { href: "/desenvolvedores", title: "Início", icon: House, inside: [] as string[] },
  { href: "/desenvolvedores/primeiro-bot", title: "Guias", icon: BookOpen, inside: GUIDES },
  { href: "/desenvolvedores/referencia", title: "Referência", icon: Code2, inside: REFERENCE },
];

export const DocsShell = ({ children }: { children: React.ReactNode }) => {
  const path = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setIsOpen(false), [path]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line bg-surface-0/90 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir o menu"
            className="-ml-1 rounded-md p-2 text-ink-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <List className="size-5" />
          </button>

          <Link href="/desenvolvedores" className="flex shrink-0 items-center gap-2.5">
            <Image
              src="/brand/logotipo.png"
              alt="Gravaê"
              width={112}
              height={28}
              className="h-6 w-auto"
            />
            <span className="hidden text-sm font-semibold uppercase tracking-wide text-ink-muted sm:block">
              Documentação
            </span>
          </Link>

          <div className="mx-auto hidden w-full max-w-lg md:block">
            <DocsSearch />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <div className="md:hidden">
              <DocsSearch compact />
            </div>

            <Link
              href="/ajuda"
              className="hidden rounded-md px-3 py-2 text-sm text-ink-muted transition hover:text-ink sm:block"
            >
              Ajuda
            </Link>

            <a
              href={APP}
              className="flex shrink-0 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-brand transition hover:text-brand-hover"
            >
              Abrir o Gravaê
              <ArrowUpRight className="size-3.5" />
            </a>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto px-4 sm:px-6">
          {TABS.map((tab) => {
            const current = path === tab.href || tab.inside.includes(path);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-sm transition ${
                  current
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <tab.icon className="size-4" />
                {tab.title}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-surface-1 px-4 py-5 transition-transform lg:sticky lg:top-[7.25rem] lg:z-0 lg:h-[calc(100vh-7.25rem)] lg:translate-x-0 lg:border-r lg:bg-transparent lg:py-8 ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } ${collapsed ? "lg:hidden" : ""}`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-sm font-semibold">Documentação</span>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar o menu"
              className="rounded-md p-1.5 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Recolher o menu"
            className="mb-5 hidden w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-ink-faint transition hover:bg-surface-2 hover:text-ink-muted lg:flex"
          >
            <PanelLeftClose className="size-4" />
            Recolher
          </button>

          {GROUPS.map((group) => (
            <div key={group.title} className="mb-6">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {group.title}
              </p>

              {group.pages.map((page) => {
                const current = path === page.href;

                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    aria-current={current ? "page" : undefined}
                    className={`block rounded-md px-2 py-1.5 text-sm transition ${
                      current
                        ? "bg-brand/10 font-medium text-brand"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {page.title}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        {isOpen ? (
          <button
            type="button"
            aria-label="Fechar o menu"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        ) : null}

        {collapsed ? (
          <div className="hidden shrink-0 pl-4 pt-10 lg:block">
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Mostrar o menu"
              className="sticky top-[8rem] rounded-md p-2 text-ink-faint transition hover:bg-surface-2 hover:text-ink"
            >
              <PanelLeft className="size-5" />
            </button>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 px-6 py-10 lg:px-12 lg:py-12">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
};
