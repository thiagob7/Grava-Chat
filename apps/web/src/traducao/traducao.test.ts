import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ptBR } from "./pt-br";
import { IDIOMAS, languages, pastaDoIdioma } from "./settings";

function achatar(objeto: unknown, prefixo = ""): Record<string, string> {
  const saida: Record<string, string> = {};

  for (const [chave, valor] of Object.entries(
    objeto as Record<string, unknown>,
  )) {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;

    if (typeof valor === "string") saida[caminho] = valor;
    else if (valor && typeof valor === "object")
      Object.assign(saida, achatar(valor, caminho));
  }

  return saida;
}

const catalogos = Object.fromEntries(
  await Promise.all(
    languages.map(async (lng) => {
      const modulo = (await import(`./${pastaDoIdioma(lng)}/index.ts`)) as {
        default: typeof ptBR;
      };

      return [lng, achatar(modulo.default)] as const;
    }),
  ),
);

const origem = achatar(ptBR);

describe("catálogos de tradução", () => {
  it("tem um catálogo para cada idioma anunciado", () => {
    expect(Object.keys(catalogos).sort()).toEqual([...languages].sort());
  });

  it("oferece na tela exatamente os idiomas que existem", () => {
    expect(IDIOMAS.map((i) => i.lng).sort()).toEqual([...languages].sort());
  });

  it("não repete idioma na lista da tela", () => {
    const codigos = IDIOMAS.map((i) => i.lng);

    expect(codigos).toHaveLength(new Set(codigos).size);
  });

  it("nenhum idioma tem chave a mais nem a menos", () => {
    const daOrigem = Object.keys(origem).sort();

    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      expect({ idioma, chaves: Object.keys(catalogo).sort() }).toEqual({
        idioma,
        chaves: daOrigem,
      });
    }
  });

  it("não perde interpolação na tradução", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      for (const [chave, texto] of Object.entries(origem)) {
        const esperadas = [...texto.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();
        const traduzido = catalogo[chave] ?? "";
        const achadas = [...traduzido.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();

        expect({ idioma, chave, vars: achadas }).toEqual({
          idioma,
          chave,
          vars: esperadas,
        });
      }
    }
  });

  it("não deixa texto vazio", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      const vazias = Object.entries(catalogo)
        .filter(([, texto]) => !texto.trim())
        .map(([chave]) => chave);

      expect({ idioma, vazias }).toEqual({ idioma, vazias: [] });
    }
  });

  it("não deixa um idioma inteiro em português", () => {
    for (const [idioma, catalogo] of Object.entries(catalogos)) {
      if (idioma === "pt-BR") continue;

      const iguais = Object.entries(origem).filter(
        ([chave, texto]) => catalogo[chave] === texto,
      );

      const proporcao = iguais.length / Object.keys(origem).length;

      expect({ idioma, traduzido: proporcao < 0.4 }).toEqual({
        idioma,
        traduzido: true,
      });
    }
  });

  it("tem tradução para toda chave que a tela pede", () => {
    const raiz = dirname(fileURLToPath(import.meta.url));

    const varrer = (pasta: string): string[] =>
      readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
        const caminho = join(pasta, item.name);

        if (item.isDirectory()) return item.name === "traducao" ? [] : varrer(caminho);
        return /\.tsx?$/.test(item.name) ? [readFileSync(caminho, "utf8")] : [];
      });

    const pedidas = new Set(
      varrer(join(raiz, "..")).flatMap((src) =>
        [
          ...src.matchAll(/"((?:chamada|comum|configuracoes|conversa|idioma|perfil|servidor)\.[\w.]+)"/g),
        ].map((m) => m[1]!),
      ),
    );

    const semTraducao = [...pedidas].filter((chave) => !(chave in origem));

    expect(semTraducao).toEqual([]);
  });

  it("tem tradução para as chaves que a tela monta por interpolação", () => {
    const raiz = dirname(fileURLToPath(import.meta.url));

    const achar = (nome: string): string => {
      const pilha = [join(raiz, "..")];

      while (pilha.length) {
        const pasta = pilha.pop()!;

        for (const item of readdirSync(pasta, { withFileTypes: true })) {
          const caminho = join(pasta, item.name);
          if (item.isDirectory()) pilha.push(caminho);
          else if (item.name === nome) return caminho;
        }
      }

      throw new Error(`não achei ${nome} em src/`);
    };

    const fontes: [string, string][] = [
      ["perfil.presenca", achar("MenuDoProprioCartao.tsx")],
      ["perfil.status", achar("StatusModal.tsx")],
    ];

    const montadas = fontes.flatMap(([prefixo, caminho]) =>
      [
        ...readFileSync(caminho, "utf8").matchAll(/\b(?:chave|detalhe): "(\w+)"/g),
      ].map((m) => `${prefixo}.${m[1]}`),
    );

    expect(montadas.length).toBeGreaterThan(8);
    expect(montadas.filter((chave) => !(chave in origem))).toEqual([]);
  });
});
