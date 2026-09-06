import vivos from "~/features/configuracoes/lib/tokens-vivos.json";

/*
  O estúdio não veste o tema que está sendo escrito.

  Um tema pode esconder botão, zerar contraste, tirar borda — e é justo, é o
  trabalho dele. Só que se ele fizer isso na própria oficina, quem escreveu
  fica sem como desfazer: o botão de voltar some junto.

  Na janela do sistema isso sai de graça, porque ela é outro documento. Dentro
  do app, não: a janela divide o documento com a tela que está sendo pintada.

  Então o estúdio recrava os próprios tokens na sua raiz, com `!important` —
  a ideia é da referência, e é melhor que o remendo que havia aqui, que
  consertava dois seletores conhecidos e deixava o resto passar.

  E os valores não são uma lista à mão: são medidos. Desligar a folha do tema
  por um instante e ler o computado devolve exatamente o que a base daria, em
  qualquer variante — claro, escuro, Gravaê — sem ninguém ter que manter uma
  tabela em dia.
*/
const NOMES = vivos as string[];

export const CLASSE_DO_ESCUDO = "janela-neutra";

export const ID_DO_ESCUDO = "gc-escudo-estudio";

/*
  O que a base daria, com o tema fora do caminho.

  Tira o estilo em linha (é por onde as substituições entram) e desliga a folha
  do tema, lê, e devolve tudo no mesmo quadro — nada chega a ser pintado.
*/
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
/* O desfoque de fundo vaza o tema por baixo do vidro; aqui atrapalha. */
.${CLASSE_DO_ESCUDO},
.${CLASSE_DO_ESCUDO} * {
  backdrop-filter: none !important;
}
`;
}
