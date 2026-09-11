import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { ptBR } from "./pt-br";
import { LANGUAGES, languages, languageFolder } from "./settings";

function flatten(object: unknown, prefix = ""): Record<string, string> {
  const output: Record<string, string> = {};

  for (const [key, value] of Object.entries(
    object as Record<string, unknown>,
  )) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "string") output[path] = value;
    else if (value && typeof value === "object")
      Object.assign(output, flatten(value, path));
  }

  return output;
}

const catalogs = Object.fromEntries(
  await Promise.all(
    languages.map(async (lng) => {
      const modulo = (await import(`./${languageFolder(lng)}/index.ts`)) as {
        default: typeof ptBR;
      };

      return [lng, flatten(modulo.default)] as const;
    }),
  ),
);

const origin = flatten(ptBR);

describe("catálogos de tradução", () => {
  it("tem um catálogo para cada idioma anunciado", () => {
    expect(Object.keys(catalogs).sort()).toEqual([...languages].sort());
  });

  it("oferece na tela exatamente os idiomas que existem", () => {
    expect(LANGUAGES.map((i) => i.lng).sort()).toEqual([...languages].sort());
  });

  it("não repete idioma na lista da tela", () => {
    const codes = LANGUAGES.map((i) => i.lng);

    expect(codes).toHaveLength(new Set(codes).size);
  });

  it("nenhum idioma tem chave a mais nem a menos", () => {
    const fromOrigin = Object.keys(origin).sort();

    for (const [language, catalog] of Object.entries(catalogs)) {
      expect({ language, keys: Object.keys(catalog).sort() }).toEqual({
        language,
        keys: fromOrigin,
      });
    }
  });

  it("não perde interpolação na tradução", () => {
    for (const [language, catalog] of Object.entries(catalogs)) {
      for (const [key, text] of Object.entries(origin)) {
        const expected = [...text.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();
        const translated = catalog[key] ?? "";
        const matches = [...translated.matchAll(/\{\{(\w+)\}\}/g)]
          .map((m) => m[1])
          .sort();

        expect({ language, key, vars: matches }).toEqual({
          language,
          key,
          vars: expected,
        });
      }
    }
  });

  it("não deixa texto vazio", () => {
    for (const [language, catalog] of Object.entries(catalogs)) {
      const empty = Object.entries(catalog)
        .filter(([, text]) => !text.trim())
        .map(([key]) => key);

      expect({ language, empty }).toEqual({ language, empty: [] });
    }
  });

  it("não deixa um idioma inteiro em português", () => {
    for (const [language, catalog] of Object.entries(catalogs)) {
      if (language === "pt-BR") continue;

      const equal = Object.entries(origin).filter(
        ([key, text]) => catalog[key] === text,
      );

      const ratio = equal.length / Object.keys(origin).length;

      expect({ language, translated: ratio < 0.4 }).toEqual({
        language,
        translated: true,
      });
    }
  });

  it("tem tradução para toda chave que a tela pede", () => {
    const root = dirname(fileURLToPath(import.meta.url));

    const sweep = (folder: string): string[] =>
      readdirSync(folder, { withFileTypes: true }).flatMap((item) => {
        const path = join(folder, item.name);

        if (item.isDirectory()) return item.name === "traducao" ? [] : sweep(path);
        return /\.tsx?$/.test(item.name) ? [readFileSync(path, "utf8")] : [];
      });

    const withoutHooks = (src: string) => src.replace(/data-gc="[^"]*"/g, "");

    const requested = new Set(
      sweep(join(root, "..")).flatMap((src) =>
        [
          ...withoutHooks(src).matchAll(
            /"((?:chamada|comum|configuracoes|conversa|idioma|perfil|servidor)\.[\w.]+)"/g,
          ),
        ].map((m) => m[1]!),
      ),
    );

    const withoutTranslation = [...requested].filter((key) => !(key in origin));

    expect(withoutTranslation).toEqual([]);
  });

  it("tem tradução para as chaves que a tela monta por interpolação", () => {
    const root = dirname(fileURLToPath(import.meta.url));

    const find = (name: string): string => {
      const stack = [join(root, "..")];

      while (stack.length) {
        const folder = stack.pop()!;

        for (const item of readdirSync(folder, { withFileTypes: true })) {
          const path = join(folder, item.name);
          if (item.isDirectory()) stack.push(path);
          else if (item.name === name) return path;
        }
      }

      throw new Error(`não achei ${name} em src/`);
    };

    const fonts: [string, string][] = [
      ["perfil.presenca", find("MenuDoProprioCartao.tsx")],
      ["perfil.status", find("StatusModal.tsx")],
    ];

    const built = fonts.flatMap(([prefix, path]) =>
      [
        ...readFileSync(path, "utf8").matchAll(/\b(?:key|detail): "(\w+)"/g),
      ].map((m) => `${prefix}.${m[1]}`),
    );

    expect(built.length).toBeGreaterThan(8);
    expect(built.filter((key) => !(key in origin))).toEqual([]);
  });
});
