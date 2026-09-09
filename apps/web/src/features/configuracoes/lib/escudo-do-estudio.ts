import vivos from "~/features/configuracoes/lib/tokens-vivos.json";

const NOMES = vivos as string[];

export const CLASSE_DO_ESCUDO = "janela-neutra";

export const ID_DO_ESCUDO = "gc-escudo-estudio";

export function medirBase(idDaFolhaDoTema: string): Record<string, string> {
  if (typeof document === "undefined") return {};

  const raiz = document.documentElement;
  const emLinha = raiz.getAttribute("style");
  const folha = document.getElementById(
    idDaFolhaDoTema,
  ) as HTMLStyleElement | null;

  raiz.removeAttribute("style");
  if (folha) folha.disabled = true;

  const lido = getComputedStyle(raiz);
  const base: Record<string, string> = {};

  for (const nome of NOMES) {
    const valor = lido.getPropertyValue(nome).trim();
    if (valor) base[nome] = valor;
  }

  if (folha) folha.disabled = false;
  if (emLinha !== null) raiz.setAttribute("style", emLinha);

  return base;
}

export function cssDoEscudo(base: Record<string, string>): string {
  const linhas = Object.entries(base)
    .map(([nome, valor]) => `  ${nome}: ${valor} !important;`)
    .join("\n");

  return `.${CLASSE_DO_ESCUDO} {\n${linhas}\n}\n
.${CLASSE_DO_ESCUDO},
.${CLASSE_DO_ESCUDO} * {
  backdrop-filter: none !important;
}
`;
}
