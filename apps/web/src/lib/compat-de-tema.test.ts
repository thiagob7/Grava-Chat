import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { describe, expect, it } from "vitest";

import { LUGARES } from "~/lib/compat-fluxer";

const raiz = dirname(fileURLToPath(import.meta.url));

const IGNORADAS = new Set(["traducao", "assets"]);

function todoOCodigo(): string {
  const partes: string[] = [];

  const andar = (pasta: string) => {
    for (const item of readdirSync(pasta, { withFileTypes: true })) {
      const caminho = join(pasta, item.name);

      if (item.isDirectory()) {
        if (!IGNORADAS.has(item.name)) andar(caminho);
      } else if (
        /\.tsx?$/.test(item.name) &&
        !item.name.endsWith(".test.ts") &&
        item.name !== "compat-fluxer.ts"
      ) {
        partes.push(readFileSync(caminho, "utf8"));
      }
    }
  };

  andar(join(raiz, ".."));

  return partes.join("\n");
}

const nomes = Object.keys(LUGARES);
const codigo = todoOCodigo();

describe("compatibilidade com temas do Fluxer", () => {
  /*
    Um lugar que ninguém carimba é pior que lugar nenhum: o tema mira e não
    acha, e a pessoa fica procurando erro no CSS dela.
  */
  it("carimba em algum elemento cada lugar do mapa", () => {
    const orfaos = nomes.filter((nome) => !codigo.includes(`"${nome}"`));

    expect(orfaos).toEqual([]);
  });

  it("não repete o mesmo nome do Fluxer em dois lugares", () => {
    const vistos = new Map<string, string>();
    const repetidos: string[] = [];

    for (const [lugar, alvo] of Object.entries(LUGARES)) {
      for (const classe of alvo.classes) {
        const dono = vistos.get(classe);
        if (dono) repetidos.push(`${classe}: ${dono} e ${lugar}`);
        else vistos.set(classe, lugar);
      }

      const caminho: string = "flx" in alvo ? alvo.flx : "";
      if (!caminho) continue;

      const donoDoFlx = vistos.get(caminho);
      if (donoDoFlx) repetidos.push(`${caminho}: ${donoDoFlx} e ${lugar}`);
      else vistos.set(caminho, lugar);
    }

    expect(repetidos).toEqual([]);
  });

  /*
    O `_gc` no fim é o que separa o nosso nome do deles se um dia os dois
    rodarem juntos, e é o que deixa claro na tela que a classe é uma ponte.
  */
  it("termina toda classe de ponte em _gc", () => {
    const fora = Object.values(LUGARES)
      .flatMap((alvo) => alvo.classes as readonly string[])
      .filter((classe) => !classe.endsWith("_gc"));

    expect(fora).toEqual([]);
  });

  it("mira o data-flx com o caminho que o Fluxer usa", () => {
    const fora: string[] = [];

    for (const alvo of Object.values(LUGARES)) {
      const caminho: string = "flx" in alvo ? alvo.flx : "";
      if (!caminho) continue;

      if (!/^[a-z0-9]+(\.[a-z0-9-]+)+$/.test(caminho)) fora.push(caminho);
    }

    expect(fora).toEqual([]);
  });
});
