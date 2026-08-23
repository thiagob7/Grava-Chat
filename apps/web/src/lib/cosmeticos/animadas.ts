import type { Decoracao } from "@gravae/shared";

interface Animada {
  arquivo: () => Promise<{ default: unknown }>;
  /**
   * Quanto o desenho transborda o avatar, em porcentagem do lado.
   *
   * Não é ajuste de layout: é o que faz o BURACO do desenho coincidir com a
   * foto. Uma arte cujo círculo ocupa 69% do quadro precisa de mais folga que um
   * anel que ocupa 84% — com uma folga só para todas, ou a moldura come a foto,
   * ou sobra um vão entre as duas.
   *
   * A conta é `(1 / proporçãoDoCírculo - 1) / 2`, com um dedo de ajuste pra a
   * moldura encostar na foto em vez de cobri-la.
   */
  folga: string;
}

/**
 * As decorações que são ARQUIVO, não CSS.
 *
 * Lottie é o formato: um JSON com a animação dentro. Vale dizer que nem todo
 * Lottie é vetor — muitos, como a moldura alada, são PNGs embutidos em base64.
 * Isso muda duas coisas: o arquivo pesa mais (centenas de KB em vez de dezenas)
 * e a cor está em pixel, então não dá pra tingir em tempo de execução.
 *
 * Cada uma entra por `import()` dinâmico, então vira um chunk próprio: quem
 * nunca cruza com uma dessas não baixa nenhum byte delas. Mesmo padrão das
 * fontes e do dataset de emoji.
 *
 * **Para acrescentar uma nova:**
 * 1. o `.json` vai em `src/assets/decoracoes/<id>.json`;
 * 2. uma linha aqui embaixo, com a folga medida;
 * 3. o id entra em `DECORACOES` no shared e o rótulo em `catalogo.ts`.
 *
 * Nenhum componente muda.
 */
const ARQUIVOS: Partial<Record<Decoracao, Animada>> = {
  // anel simples: o círculo ocupa 84% do quadro
  aro: { arquivo: () => import("~/assets/decoracoes/aro.json"), folga: "-16%" },
  // moldura com asas e estrela: o círculo ocupa só 69%, e o resto transborda
  alada: { arquivo: () => import("~/assets/decoracoes/alada.json"), folga: "-24%" },
};

export const ehAnimada = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in ARQUIVOS);

/**
 * Carrega o desenho. `null` quando o id não é de uma animada — quem chama usa
 * isso pra decidir entre o player e a camada de CSS.
 */
export async function carregarDecoracao(decoracao: Decoracao): Promise<unknown | null> {
  const animada = ARQUIVOS[decoracao];
  if (!animada) return null;

  return (await animada.arquivo()).default;
}

/** A folga desta decoração, ou a mesma da camada de CSS. */
export const folgaDaDecoracao = (decoracao: Decoracao): string =>
  ARQUIVOS[decoracao]?.folga ?? "-16%";
