import type { Patente } from "@gravae/shared";

interface Arte {
  arquivo: () => Promise<{ default: unknown }>;
  /**
   * A PROPORÇÃO do quadro, largura ÷ altura.
   *
   * Fica aqui e não no CSS porque cada arte tem a sua, e é ela que decide a
   * largura da insígnia quando o que se escolhe é a altura. Sem isso o quadro
   * ou estica ou sobra vazio dos lados — e uma insígnia com vazio dos lados
   * abre um buraco no meio da linha do nome.
   *
   * Sai do `w`/`h` do próprio arquivo, já recortado por `scripts/recortar.py`.
   */
  proporcao: number;
}

/**
 * As patentes que são arte, e não CSS.
 *
 * Mesmo desenho de `animadas.ts`, e a repetição é de propósito: são dois
 * catálogos com perguntas diferentes. A decoração precisa saber a FOLGA, porque
 * ela envolve uma foto redonda; a patente precisa saber a PROPORÇÃO, porque ela
 * ocupa um pedaço de uma linha de texto. Um mapa só serviria mal às duas.
 *
 * O `import()` é preguiçoso: quem nunca abriu um cartão de perfil nunca baixa
 * nenhum destes arquivos.
 */
const ARQUIVOS: Partial<Record<Patente, Arte>> = {
  /*
    Orbe alado. Veio da mesma tira larga de 1000×591 que o selo do sol, e foi
    recortada pelo `scripts/recortar.py` até a borda real do desenho: 953×526.

    Diferente das decorações, esta arte NÃO tem furo — o orbe do meio é opaco.
    Foi por isso que ela não virou decoração de avatar: em cima de uma foto, ela
    cobria a cara da pessoa. Como insígnia, o orbe é o assunto.

    Também não tem laço: as sete peças saem de trás do orbe entre os quadros 0 e
    145 e ficam paradas até o fim. É a montagem da insígnia, e ela acontece uma
    vez, quando o cartão abre.
  */
  orbe: {
    arquivo: () => import("~/assets/patentes/orbe.json"),
    proporcao: 953 / 526,
  },
};

export const ehPatenteComArte = (patente: Patente | null | undefined): boolean =>
  !!patente && patente in ARQUIVOS;

/** Carrega o desenho. `null` quando o id não tem arte — hoje só `nenhuma`. */
export async function carregarPatente(patente: Patente): Promise<unknown | null> {
  const arte = ARQUIVOS[patente];
  if (!arte) return null;

  return (await arte.arquivo()).default;
}

/** Largura ÷ altura desta arte; `1` pra quem não tem, que não vai desenhar nada. */
export const proporcaoDaPatente = (patente: Patente): number =>
  ARQUIVOS[patente]?.proporcao ?? 1;
