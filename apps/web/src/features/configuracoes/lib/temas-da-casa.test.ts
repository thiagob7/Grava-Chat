import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { lerCabecalhoDoTema } from "@gravae/shared";

import { CLASSES_DE_TEMA } from "~/features/configuracoes/lib/ganchos-de-tema";
import macanetas from "~/features/configuracoes/lib/macanetas.json";
import tokensVivos from "~/features/configuracoes/lib/tokens-vivos.json";

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
      autor: cabecalho.autor ?? "",
      css,
    };
  });

interface Regra {
  seletor: string;
  declaracoes: string[];
}

function regras(css: string): Regra[] {
  const semCabecalho = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const achadas: Regra[] = [];

  const andar = (trecho: string) => {
    let inicio = 0;
    let profundidade = 0;
    let abertura = -1;

    for (let i = 0; i < trecho.length; i++) {
      const letra = trecho[i];

      if (letra === "{") {
        if (profundidade === 0) abertura = i;
        profundidade++;
        continue;
      }

      if (letra !== "}") continue;

      profundidade--;
      if (profundidade > 0) continue;

      const prelúdio = trecho.slice(inicio, abertura).trim();
      const corpo = trecho.slice(abertura + 1, i);
      inicio = i + 1;

      if (prelúdio.startsWith("@")) {
        const nome = /^@([a-z-]+)/i.exec(prelúdio)?.[1]?.toLowerCase();
        if (nome === "media" || nome === "supports" || nome === "layer") andar(corpo);
        continue;
      }

      achadas.push({
        seletor: prelúdio,
        declaracoes: corpo
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => d.slice(0, d.indexOf(":")).trim())
          .filter(Boolean),
      });
    }
  };

  andar(semCabecalho);
  return achadas;
}

const LIDAS = new Set<string>([
  ...Object.values(macanetas as Record<string, string[]>).flat(),
  ...(tokensVivos as string[]),
]);

const PALETA = Object.values(macanetas as Record<string, string[]>).map((nomes) => nomes[0]!);

const RAIZES = new Set(["html", "body", "#app", ":root"]);

function peçasDeFora(seletor: string): string[] {
  return seletor
    .split(",")
    .map((parte) => parte.trim())
    .flatMap((parte) =>
      parte
        .replace(/::?[a-z-]+(\([^)]*\))?/gi, "")
        .split(/[\s>+~]+/)
        .map((peça) => peça.trim())
        .filter(Boolean),
    )
    .filter((peça) => !RAIZES.has(peça) && !CLASSES_DE_TEMA.includes(peça.replace(/^\./, "")));
}

describe("temas da casa", () => {
  it("todos têm nome, descrição e a autoria da casa", () => {
    expect(TEMAS_DA_CASA.length).toBeGreaterThanOrEqual(4);

    for (const tema of TEMAS_DA_CASA) {
      expect(tema.nome, tema.chave).not.toBe("");
      expect(tema.descricao, tema.chave).not.toBe("");
      expect(tema.autor, tema.chave).toBe(AUTOR_DA_CASA);
    }
  });

  it("declara a paleta inteira, e nada que o app não leia", () => {
    for (const tema of TEMAS_DA_CASA) {
      const naRaiz = regras(tema.css).filter((r) => r.seletor === ":root");
      const declaradas = naRaiz.flatMap((r) => r.declaracoes);
      const surdas = declaradas.filter((d) => d.startsWith("--") && !LIDAS.has(d));

      expect(surdas, tema.chave).toEqual([]);
      expect(new Set(declaradas).size, tema.chave).toBe(declaradas.length);

      const faltam = PALETA.filter((nome) => !declaradas.includes(nome));
      expect(faltam, tema.chave).toEqual([]);
    }
  });

  it("só mira raízes da página e ganchos que a gente publica", () => {
    for (const tema of TEMAS_DA_CASA) {
      const forasteiros = regras(tema.css).flatMap((r) => peçasDeFora(r.seletor));

      expect([...new Set(forasteiros)], tema.chave).toEqual([]);
    }
  });

  it("não usa !important", () => {
    for (const tema of TEMAS_DA_CASA) {
      expect(tema.css.includes("!important"), tema.chave).toBe(false);
    }
  });

  it("tema que se mexe respeita quem pediu menos movimento", () => {
    for (const tema of TEMAS_DA_CASA) {
      if (!/\banimation:/.test(tema.css)) continue;

      expect(tema.css, tema.chave).toContain("prefers-reduced-motion");
    }
  });
});
