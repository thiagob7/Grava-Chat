import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { lerCabecalhoDoTema } from "@gravae/shared";

import macanetas from "~/features/configuracoes/lib/macanetas.json";
import tokensVivos from "~/features/configuracoes/lib/tokens-vivos.json";

/*
  Os temas da casa moram na API (`apps/api/temas/`), que é quem os publica no
  servidor "Gravaê Temas". O contrato deles, porém, é com este app: são as
  variáveis daqui que eles têm que falar. Por isso o teste fica aqui e lê de lá.
*/
const PASTA = fileURLToPath(new URL("../../../../../api/temas/", import.meta.url));
const AUTOR_DA_CASA = "Gravaê";

const TEMAS_DA_CASA = readdirSync(PASTA)
  .filter((a) => a.endsWith(".css"))
  .sort()
  .map((arquivo) => {
    const css = readFileSync(PASTA + arquivo, "utf8");
    const cabecalho = lerCabecalhoDoTema(css);

    return {
      chave: arquivo.replace(/\.css$/, ""),
      nome: cabecalho.nome ?? "",
      descricao: cabecalho.descricao ?? "",
      css,
    };
  });

/*
  Cada tema é uma sequência de blocos `seletor { declarações }` sem
  aninhamento, depois do cabeçalho. Não precisa de parser: o formato da casa
  não tem @media, não tem regra dentro de regra.
*/
function blocos(css: string) {
  const semCabecalho = css.replace(/^\s*\/\*\*[\s\S]*?\*\//, "");

  return [...semCabecalho.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletor: m[1]!.trim(),
    declaracoes: m[2]!
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => d.slice(0, d.indexOf(":")).trim()),
  }));
}

/// Tudo que o app lê: as cabeças e apelidos de cada cadeia, e os tokens vivos.
const LIDAS = new Set<string>([
  ...Object.values(macanetas as Record<string, string[]>).flat(),
  ...(tokensVivos as string[]),
]);

/// A paleta inteira: a primeira porta de cada cadeia de cor.
const PALETA = Object.values(macanetas as Record<string, string[]>).map((nomes) => nomes[0]!);

describe("temas da casa", () => {
  it("tem quatro, com nome, descrição e autor", () => {
    expect(TEMAS_DA_CASA.map((t) => t.chave)).toEqual(["carvao", "floresta", "manha", "nebulosa"]);

    for (const tema of TEMAS_DA_CASA) {
      expect(tema.nome).not.toBe("");
      expect(tema.descricao).not.toBe("");
      expect(lerCabecalhoDoTema(tema.css).autor).toBe(AUTOR_DA_CASA);
    }
  });

  it("só fala em :root", () => {
    for (const tema of TEMAS_DA_CASA) {
      const seletores = blocos(tema.css).map((b) => b.seletor);

      expect(seletores.length, tema.chave).toBeGreaterThan(0);
      expect(seletores, tema.chave).toEqual(seletores.map(() => ":root"));
      expect(tema.css, tema.chave).not.toContain("!important");
    }
  });

  it("só declara o que o app lê", () => {
    for (const tema of TEMAS_DA_CASA) {
      const declaradas = blocos(tema.css).flatMap((b) => b.declaracoes);
      const surdas = declaradas.filter((d) => d !== "color-scheme" && !LIDAS.has(d));

      expect(surdas, tema.chave).toEqual([]);
      expect(new Set(declaradas).size, tema.chave).toBe(declaradas.length);
    }
  });

  it("declara a paleta inteira", () => {
    for (const tema of TEMAS_DA_CASA) {
      const declaradas = new Set(blocos(tema.css).flatMap((b) => b.declaracoes));
      const faltam = PALETA.filter((nome) => !declaradas.has(nome));

      expect(faltam, tema.chave).toEqual([]);
    }
  });
});
