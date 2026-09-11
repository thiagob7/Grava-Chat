import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Header } from "~/components/Cabecalho";
import { Footer } from "~/components/Rodape";
import { BODIES } from "~/app/ajuda/corpos";
import {
  findArticle,
  ARTICLES,
  CATEGORIES,
  categoryArticles,
  writeData,
} from "~/dados/ajuda";

interface Props {
  params: Promise<{ artigo: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((article) => ({ artigo: article.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { artigo: id } = await params;
  const article = findArticle(id);

  if (!article) return { title: "Ajuda — Gravaê" };

  return {
    title: `${article.title} — Ajuda do Gravaê`,
    description: article.summary,
  };
}

export default async function Article({ params }: Props) {
  const { artigo: id } = await params;
  const article = findArticle(id);
  const body = BODIES[id];

  if (!article || !body) notFound();

  const category = CATEGORIES.find((c) => c.id === article.categoryId);
  const neighbors = categoryArticles(article.categoryId).filter((other) => other.id !== id);

  return (
    <>
      <Header />

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16">
        <Link
          href="/ajuda"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft size={15} /> Central de ajuda
        </Link>

        {category && (
          <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-brand">
            {category.title}
          </p>
        )}

        <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{article.title}</h1>

        <p className="mt-3 text-sm text-ink-faint">
          Última atualização em {writeData(article.updatedAt)}.
        </p>

        <div className="mt-8 space-y-4 border-t border-line/70 pt-8 text-base leading-relaxed text-ink-muted [&_table]:text-sm">
          {body}
        </div>

        {neighbors.length > 0 && (
          <section className="mt-16 border-t border-line/70 pt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-faint">
              Também em {category?.title}
            </h2>

            <ul className="mt-4 flex flex-col gap-2">
              {neighbors.map((other) => (
                <li key={other.id}>
                  <Link
                    href={`/ajuda/${other.id}`}
                    className="text-sm text-ink-muted transition hover:text-brand"
                  >
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
