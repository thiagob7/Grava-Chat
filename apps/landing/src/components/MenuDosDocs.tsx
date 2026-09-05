"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PAGINAS } from "~/dados/docs";

export const MenuDosDocs = () => {
  const caminho = usePathname();

  return (
    <nav className="lg:sticky lg:top-24">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Documentação
      </p>

      <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {PAGINAS.map((pagina) => {
          const atual = caminho === pagina.href;

          return (
            <Link
              key={pagina.href}
              href={pagina.href}
              aria-current={atual ? "page" : undefined}
              className={`shrink-0 rounded-md px-3 py-1.5 text-sm transition ${
                atual
                  ? "bg-surface-2 font-medium text-ink"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              {pagina.titulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
