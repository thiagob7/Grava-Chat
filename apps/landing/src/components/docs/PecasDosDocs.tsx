import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { vizinhas } from "~/dados/docs";

export const Trilha = ({ grupo, pagina }: { grupo: string; pagina: string }) => (
  <p className="text-sm text-ink-faint">
    {grupo} <span className="px-1.5">/</span>
    <span className="text-ink-muted">{pagina}</span>
  </p>
);

export const Titulo = ({ children, chamada }: { children: string; chamada: string }) => (
  <>
    <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>
    <p className="mt-3 text-base leading-relaxed text-ink-muted">{chamada}</p>
  </>
);

export const Secao = ({
  id,
  titulo,
  children,
}: {
  id: string;
  titulo: string;
  children: React.ReactNode;
}) => (
  <section id={id} className="scroll-mt-36">
    <h2 className="text-xl font-bold">
      <a href={`#${id}`} className="group">
        {titulo}
        <span className="pl-2 text-ink-faint opacity-0 transition group-hover:opacity-100">#</span>
      </a>
    </h2>

    <div className="mt-3 space-y-4 text-sm leading-relaxed text-ink-muted">{children}</div>
  </section>
);

export const Aviso = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-brand/30 bg-brand/[0.07] px-4 py-3 text-sm leading-relaxed text-ink-muted">
    {children}
  </div>
);

export const Cartoes = ({
  itens,
}: {
  itens: { href: string; titulo: string; texto: string }[];
}) => (
  <div className="grid gap-3 sm:grid-cols-2">
    {itens.map((item) => (
      <Link
        key={item.href}
        href={item.href}
        className="group rounded-xl border border-line bg-surface-1 p-5 transition hover:border-surface-4 hover:bg-surface-2"
      >
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          {item.titulo}
          <ArrowRight className="size-4 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand" />
        </span>

        <span className="mt-1.5 block text-sm leading-relaxed text-ink-muted">{item.texto}</span>
      </Link>
    ))}
  </div>
);

export const Adiante = ({ href }: { href: string }) => {
  const { anterior, proxima } = vizinhas(href);

  return (
    <nav className="flex gap-3 border-t border-line pt-8">
      {anterior ? (
        <Link
          href={anterior.href}
          className="group flex flex-1 items-center gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 transition hover:bg-surface-2"
        >
          <ArrowLeft className="size-4 shrink-0 text-ink-faint transition group-hover:text-brand" />

          <span className="min-w-0">
            <span className="block text-xs text-ink-faint">Antes</span>
            <span className="block truncate text-sm font-medium text-ink">{anterior.titulo}</span>
          </span>
        </Link>
      ) : null}

      {proxima ? (
        <Link
          href={proxima.href}
          className="group ml-auto flex flex-1 items-center justify-end gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 text-right transition hover:bg-surface-2"
        >
          <span className="min-w-0">
            <span className="block text-xs text-ink-faint">Depois</span>
            <span className="block truncate text-sm font-medium text-ink">{proxima.titulo}</span>
          </span>

          <ArrowRight className="size-4 shrink-0 text-ink-faint transition group-hover:text-brand" />
        </Link>
      ) : null}
    </nav>
  );
};
