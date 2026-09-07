import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import Color from "color";
import { describe, expect, it } from "vitest";

import {
  CORES_MAE,
  MAES,
  TOKENS_DERIVADOS,
  completarComDerivacao,
  derivar,
  montarTema,
} from "~/features/configuracoes/lib/cores-mae";

const raiz = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(
  join(raiz, "..", "..", "..", "styles", "index.css"),
  "utf8",
);

/*
  O valor de reserva no fim da cadeia.

  Desde que as cores nascem do nome da referência, o `@theme` guarda
  `var(--background-primary, var(--bg-primary, #1a181e))` em vez de `#1a181e`.
  A cor do tema base é a última — a que vale quando nenhum tema declarou nada — e
  é dela que as distâncias das cores-mãe são medidas.
*/
function corDaReserva(valor: string): string {
  let v = valor.trim();

  while (v.startsWith("var(")) {
    const virgula = v.indexOf(",");
    if (virgula < 0) return v;
    v = v.slice(virgula + 1, v.lastIndexOf(")")).trim();
  }

  return v;
}

function coresDoTema(): Record<string, string> {
  const inicio = css.indexOf("@theme {");
  const corpo = css.slice(inicio, css.indexOf("\n}", inicio));
  const cores: Record<string, string> = {};

  for (const [, nome, valor] of corpo.matchAll(
    /^\s+(--color-[\w-]+):\s*([^;]+);/gm,
  )) {
    if (nome && valor) cores[nome] = corDaReserva(valor);
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

  /*
    A queixa que abriu esta leva: "importei o tema e pouca coisa mudou". Um
    tema de fora nunca fala dos nomes que só existem aqui, então tudo que é
    nosso ficava de fábrica no meio de um tema vermelho.
  */
  it("preenche o que o tema não disse a partir do que ele disse", () => {
    const doTema = { "--color-surface-0": "#1a0000" };
    const resto = completarComDerivacao(doTema);

    /// O palco de voz e o véu não existem no vocabulário de nenhum tema de fora.
    expect(resto["--color-palco"]).toBeTruthy();
    expect(resto["--color-veu"]).toBeTruthy();
    expect(resto["--color-line"]).toBeTruthy();
    expect(resto["--color-hover"]).toBeTruthy();

    /// E acompanham a cor que o tema deu, em vez de ficarem de fábrica.
    const [, croma = 0, matiz = 0] = Color(resto["--color-surface-3"]!)
      .lch()
      .array();
    expect(croma).toBeGreaterThan(1);
    expect(Math.abs(matiz - (Color("#1a0000").lch().array()[2] ?? 0))).toBeLessThan(20);
  });

  it("não encosta no que o tema disse com todas as letras", () => {
    const doTema = {
      "--color-surface-0": "#1a0000",
      "--color-surface-3": "#00ff00",
      "--color-line": "#0000ff",
    };

    const resto = completarComDerivacao(doTema);

    expect(resto["--color-surface-3"]).toBeUndefined();
    expect(resto["--color-line"]).toBeUndefined();
  });

  it("sem cor de mãe no tema, não inventa nada", () => {
    expect(completarComDerivacao({ "--color-mencao": "#fff" })).toEqual({});
  });
});
