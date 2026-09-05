"use client";

import { ArrowUpRight, BookOpen, Code2, House, List, PanelLeft, PanelLeftClose, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { BuscaDosDocs } from "~/components/docs/BuscaDosDocs";
import { APP, GRUPOS } from "~/dados/docs";

const GUIAS = [
  "/desenvolvedores/primeiro-bot",
  "/desenvolvedores/tempo-real",
  "/desenvolvedores/comandos",
  "/desenvolvedores/moderacao",
];

const REFERENCIA = [
  "/desenvolvedores/referencia",
  "/desenvolvedores/eventos",
  "/desenvolvedores/limites",
  "/desenvolvedores/temas",
];

const ABAS = [
  { href: "/desenvolvedores", titulo: "Início", icone: House, dentro: [] as string[] },
  { href: "/desenvolvedores/primeiro-bot", titulo: "Guias", icone: BookOpen, dentro: GUIAS },
  { href: "/desenvolvedores/referencia", titulo: "Referência", icone: Code2, dentro: REFERENCIA },
];

export const CascaDosDocs = ({ children }: { children: React.ReactNode }) => {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [recolhida, setRecolhida] = useState(false);

  useEffect(() => setAberto(false), [caminho]);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line bg-surface-0/90 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setAberto(true)}
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
            <BuscaDosDocs />
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <div className="md:hidden">
              <BuscaDosDocs compacta />
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
          {ABAS.map((aba) => {
            const atual = caminho === aba.href || aba.dentro.includes(caminho);

            return (
              <Link
                key={aba.href}
                href={aba.href}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-2.5 pt-1 text-sm transition ${
                  atual
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-ink-muted hover:text-ink"
                }`}
              >
                <aba.icone className="size-4" />
                {aba.titulo}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-line bg-surface-1 px-4 py-5 transition-transform lg:sticky lg:top-[7.25rem] lg:z-0 lg:h-[calc(100vh-7.25rem)] lg:translate-x-0 lg:border-r lg:bg-transparent lg:py-8 ${
            aberto ? "translate-x-0" : "-translate-x-full"
          } ${recolhida ? "lg:hidden" : ""}`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="text-sm font-semibold">Documentação</span>

            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar o menu"
              className="rounded-md p-1.5 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            >
              <X className="size-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setRecolhida(true)}
            aria-label="Recolher o menu"
            className="mb-5 hidden w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-ink-faint transition hover:bg-surface-2 hover:text-ink-muted lg:flex"
          >
            <PanelLeftClose className="size-4" />
            Recolher
          </button>

          {GRUPOS.map((grupo) => (
            <div key={grupo.titulo} className="mb-6">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {grupo.titulo}
              </p>

              {grupo.paginas.map((pagina) => {
                const atual = caminho === pagina.href;

                return (
                  <Link
                    key={pagina.href}
                    href={pagina.href}
                    aria-current={atual ? "page" : undefined}
                    className={`block rounded-md px-2 py-1.5 text-sm transition ${
                      atual
                        ? "bg-brand/10 font-medium text-brand"
                        : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {pagina.titulo}
                  </Link>
                );
              })}
            </div>
          ))}
        </aside>

        {aberto ? (
          <button
            type="button"
            aria-label="Fechar o menu"
            onClick={() => setAberto(false)}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          />
        ) : null}

        {recolhida ? (
          <div className="hidden shrink-0 pl-4 pt-10 lg:block">
            <button
              type="button"
              onClick={() => setRecolhida(false)}
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
