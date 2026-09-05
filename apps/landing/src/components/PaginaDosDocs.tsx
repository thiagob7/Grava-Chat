import Link from "next/link";

import { PAGINAS } from "~/dados/docs";

export const Secao = ({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-24">
    <h2 className="text-xl font-bold">{titulo}</h2>
    <div className="mt-3 space-y-4 text-sm leading-relaxed text-ink-muted">{children}</div>
  </section>
);

export const CabecalhoDaPagina = ({
  titulo,
  chamada,
}: {
  titulo: string;
  chamada: string;
}) => (
  <header>
    <h1 className="text-3xl font-bold sm:text-4xl">{titulo}</h1>
    <p className="mt-3 text-base leading-relaxed text-ink-muted">{chamada}</p>
  </header>
);

export const Adiante = ({ href }: { href: string }) => {
  const indice = PAGINAS.findIndex((pagina) => pagina.href === href);
  const anterior = PAGINAS[indice - 1];
  const proxima = PAGINAS[indice + 1];

  return (
    <nav className="flex gap-3 border-t border-line/70 pt-8">
      {anterior ? (
        <Link
          href={anterior.href}
          className="flex-1 rounded-xl border border-line bg-surface-1 px-4 py-3 transition hover:border-line hover:bg-surface-2"
        >
          <span className="text-xs text-ink-faint">Antes</span>
          <span className="mt-0.5 block text-sm font-medium text-ink">{anterior.titulo}</span>
        </Link>
      ) : null}

      {proxima ? (
        <Link
          href={proxima.href}
          className="flex-1 rounded-xl border border-line bg-surface-1 px-4 py-3 text-right transition hover:bg-surface-2"
        >
          <span className="text-xs text-ink-faint">Depois</span>
          <span className="mt-0.5 block text-sm font-medium text-ink">{proxima.titulo}</span>
        </Link>
      ) : null}
    </nav>
  );
};
