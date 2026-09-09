import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { lerCabecalhoDoTema } from "@gravae/shared";

function pastaDosTemas(): string | null {
  for (const candidata of ["./temas/", "../temas/"]) {
    const caminho = fileURLToPath(new URL(candidata, import.meta.url));
    if (existsSync(caminho)) return caminho;
  }

  return null;
}

export interface TemaDaCasa {
  chave: string;
  nome: string;
  descricao: string;
  versao: string;
  css: string;
}

export function lerTemasDaCasa(): TemaDaCasa[] {
  const pasta = pastaDosTemas();
  if (!pasta) return [];

  return readdirSync(pasta)
    .filter((arquivo) => arquivo.endsWith(".css"))
    .sort()
    .map((arquivo) => {
      const css = readFileSync(pasta + arquivo, "utf8");
      const cabecalho = lerCabecalhoDoTema(css);

      return {
        chave: arquivo.replace(/\.css$/, ""),
        nome: cabecalho.nome ?? arquivo,
        descricao: cabecalho.descricao ?? "",
        versao: cabecalho.versao ?? "",
        css,
      };
    });
}
