import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import Color from "color";
import { describe, expect, it } from "vitest";

import {
  CORES_MAE,
  MAES,
  TOKENS_DERIVADOS,
  derivar,
  montarTema,
} from "~/features/configuracoes/lib/cores-mae";

const raiz = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(
  join(raiz, "..", "..", "..", "styles", "index.css"),
  "utf8",
);

function coresDoTema(): Record<string, string> {
  const inicio = css.indexOf("@theme {");
  const corpo = css.slice(inicio, css.indexOf("\n}", inicio));
  const cores: Record<string, string> = {};

  for (const [, nome, valor] of corpo.matchAll(
    /^\s+(--color-[\w-]+):\s*([^;]+);/gm,
  )) {
    if (nome && valor) cores[nome] = valor.trim();
  }

  return cores;
}

const mesmaCor = (a: string, b: string) => {
  const x = Color(a);
  const y = Color(b);

  return (
    x.rgb().array().map(Math.round).join() ===
      y.rgb().array().map(Math.round).join() &&
    Math.abs(x.alpha() - y.alpha()) < 0.005
  );
};

describe("cores-mãe", () => {
  /*
    A invariante que sustenta o resto: derivar com a cor que já está lá tem que
    devolver o tema de hoje. Se a derivação não for a identidade no padrão, ela
    é um chute — e ninguém consegue conferir um chute cor por cor.
  */
  it("derivar o padrão devolve o tema base, cor por cor", () => {
    const base = coresDoTema();
    const diferentes: string[] = [];

    for (const id of MAES) {
      const familia = CORES_MAE[id]!;

      for (const [nome, valor] of Object.entries(
        derivar(id, familia.padrao),
      )) {
        const esperado = base[nome];
        if (esperado && !mesmaCor(esperado, valor)) {
          diferentes.push(`${nome}: base ${esperado} · derivado ${valor}`);
        }
      }
    }

    expect(diferentes).toEqual([]);
  });

  it("clarear a mãe do fundo escurece as bordas, em vez de sumir com elas", () => {
    const escuro = derivar("fundo", "#1a181e");
    const claro = derivar("fundo", "#f2f2f4");

    const luz = (cor: string) => Color(cor).lch().array()[0] ?? 0;

    expect(luz(escuro["--color-line"]!)).toBeGreaterThan(luz("#1a181e"));
    expect(luz(claro["--color-line"]!)).toBeLessThan(luz("#f2f2f4"));
  });

  it("o véu do modal continua escuro num tema claro", () => {
    const claro = derivar("fundo", "#f2f2f4");

    expect(Color(claro["--color-veu"]!).lch().array()[0]).toBeLessThan(20);
  });

  it("o texto de cima do botão vira o polo oposto ao da marca", () => {
    const luz = (cor: string) => Color(cor).lch().array()[0] ?? 0;

    expect(luz(derivar("marca", "#413cdd")["--color-sobre-marca"]!)).toBeGreaterThan(90);
    expect(luz(derivar("marca", "#f7d56e")["--color-sobre-marca"]!)).toBeLessThan(10);
  });

  it("a rampa do fundo respeita a ordem de luminosidade", () => {
    const cores = derivar("fundo", "#123123");
    const luz = (nome: string) => Color(cores[nome]!).lch().array()[0] ?? 0;

    expect(luz("--color-surface-0")).toBeLessThanOrEqual(luz("--color-surface-2"));
    expect(luz("--color-surface-2")).toBeLessThanOrEqual(luz("--color-surface-3"));
    expect(luz("--color-surface-3")).toBeLessThanOrEqual(luz("--color-surface-4"));
  });

  it("o fator de saturação zerado entrega cinza", () => {
    const cores = derivar("marca", "#413cdd", 0);

    for (const valor of Object.values(cores)) {
      const [, croma = 0] = Color(valor).lch().array();
      expect(croma).toBeLessThan(1);
    }
  });

  it("não deixa duas mães brigando pelo mesmo token", () => {
    const todos = Object.values(CORES_MAE).flatMap((f) => [
      f.mae,
      ...f.filhas.map((c) => c.nome),
    ]);

    expect(todos).toHaveLength(TOKENS_DERIVADOS.size);
  });

  /*
    A promessa que sustenta as duas abas juntas: escolher uma cor-mãe não pode
    desmanchar o que a pessoa ajustou token a token. Se esta cair, a aba Cores
    passa a comer a aba Tokens no clique seguinte.
  */
  it("o que foi mexido à mão sobrevive a uma nova derivação", () => {
    const meu = { "--color-surface-2": "#0d0d0d" };

    const antes = montarTema({ fundo: "#1a181e" }, 1, meu);
    const depois = montarTema({ fundo: "#2b1a3d" }, 1, meu);

    expect(antes["--color-surface-2"]).toBe("#0d0d0d");
    expect(depois["--color-surface-2"]).toBe("#0d0d0d");

    /// E as irmãs dele continuam acompanhando a mãe.
    expect(depois["--color-surface-3"]).not.toBe(antes["--color-surface-3"]);
  });

  it("sem mãe escolhida, o tema é só o que foi mexido à mão", () => {
    expect(montarTema({}, 1, { "--color-ink": "#fff" })).toEqual({
      "--color-ink": "#fff",
    });
  });
});
