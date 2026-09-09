import { PONTE_DE_TEMA, nomesDeclaradosNoTema } from "~/features/configuracoes/lib/ponte-de-tema";
import { TOKENS_DERIVADOS } from "~/features/configuracoes/lib/cores-mae";

export interface CompatibilidadeDeTokens {
  traduzidos: string[];
  deduzidos: string[];
  ignorados: string[];
}

const usadaPeloProprioTema = (css: string, nome: string) =>
  css.includes(`var(${nome}`) || css.includes(`var( ${nome}`);

export function conferirTokens(css: string): CompatibilidadeDeTokens {
  const declarados = nomesDeclaradosNoTema(css);

  const traduzidos: string[] = [];
  const ignorados: string[] = [];
  const destinos = new Set<string>();

  for (const nome of [...declarados].sort()) {
    const alvos = PONTE_DE_TEMA[nome];

    if (alvos) {
      traduzidos.push(nome);
      for (const alvo of alvos) destinos.add(alvo);
      continue;
    }

    if (!usadaPeloProprioTema(css, nome)) ignorados.push(nome);
  }

  const deduzidos = [...TOKENS_DERIVADOS]
    .filter((token) => !destinos.has(token))
    .sort();

  return { traduzidos, deduzidos, ignorados };
}
