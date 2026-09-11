import type { Metadata } from "next";

import { Header } from "~/components/Cabecalho";
import { HelpCentral } from "~/components/CentralDeAjuda";
import { Footer } from "~/components/Rodape";
import { ARTICLES, CATEGORIES } from "~/dados/ajuda";

export const metadata: Metadata = {
  title: "Central de ajuda — Gravaê",
  description:
    "Respostas sobre a sua conta e a sua privacidade, e como usar servidores, conversas e chamadas no Gravaê.",
};

export default function Help() {
  return (
    <>
      <Header />

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">
        <h1 className="text-4xl font-bold sm:text-5xl">Central de ajuda</h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-muted">
          Encontre respostas sobre a sua conta e a sua privacidade, ou peça ajuda para usar o
          Gravaê.
        </p>

        <HelpCentral categories={CATEGORIES} articles={ARTICLES} />
      </main>

      <Footer />
    </>
  );
}
