"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LifeBuoy, MessagesSquare, Rocket, Search, Server, UserCog } from "lucide-react";

import {
  writeData,
  type HelpArticle,
  type HelpCategory,
} from "~/dados/ajuda";

const ICONS: Record<HelpCategory["icon"], React.ReactNode> = {
  comecar: <Rocket size={18} />,
  servidor: <Server size={18} />,
  conversa: <MessagesSquare size={18} />,
  conta: <UserCog size={18} />,
  socorro: <LifeBuoy size={18} />,
};

const withoutAccent = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const HelpCentral: React.FC<{
  categories: HelpCategory[];
  articles: HelpArticle[];
}> = ({ categories, articles }) => {
  const [search, setSearch] = useState("");

  const matches = useMemo(() => {
    const words = withoutAccent(search).split(/\s+/).filter(Boolean);
    if (!words.length) return articles;

    return articles.filter((article) => {
      const target = withoutAccent(`${article.title} ${article.summary}`);
      return words.every((word) => target.includes(word));
    });
  }, [articles, search]);

  const withArticles = categories
    .map((category) => ({
      category,
      articles: matches.filter((article) => article.categoryId === category.id),
    }))
    .filter((group) => group.articles.length);

  return (
    <>
      <label className="mt-10 flex items-center gap-3 rounded-xl border border-line bg-surface-1 px-4 py-3 focus-within:border-brand">
        <Search size={18} className="shrink-0 text-ink-faint" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar artigos de ajuda…"
          aria-label="Pesquisar artigos de ajuda"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint"
        />
      </label>

      <h2 className="mt-16 text-2xl font-bold">
        {search.trim() ? "Artigos encontrados" : "Todos os artigos de ajuda"}
      </h2>

      {!withArticles.length && (
        <p className="mt-6 text-sm text-ink-muted">
          Nenhum artigo com esse nome. Tente outra palavra, ou pergunte no GitHub.
        </p>
      )}

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {withArticles.map(({ category, articles: fromCategory }) => (
          <section
            key={category.id}
            className="flex flex-col rounded-xl border border-line bg-surface-1 p-6"
          >
            <header className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/15 text-brand">
                {ICONS[category.icon]}
              </span>

              <span className="min-w-0">
                <h3 className="text-lg font-bold leading-tight">{category.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{category.description}</p>
              </span>
            </header>

            <ul className="mt-6 flex flex-col gap-5 border-t border-line/70 pt-5">
              {fromCategory.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/ajuda/${article.id}`}
                    className="group flex items-start justify-between gap-4"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink transition group-hover:text-brand">
                        {article.title}
                      </span>
                      <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                        {article.summary}
                      </span>
                      <span className="mt-1 block text-xs text-ink-faint">
                        Última atualização em {writeData(article.updatedAt)}.
                      </span>
                    </span>

                    <ArrowRight
                      size={16}
                      className="mt-0.5 shrink-0 text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-brand"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
};
