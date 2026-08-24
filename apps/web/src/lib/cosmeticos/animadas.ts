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
   * A conta, com o furo MEDIDO (não estimado — use
   * `scripts/medir-furo.py`, que existe porque no olho eu errei os dois):
   *
   *     folga = -((alvo / (furo / lado)) - 1) / 2
   *
   * `alvo` é quanto do avatar o furo deve cobrir. 0,88 deixa a moldura
   * encostando na borda da foto, que é como moldura de verdade se comporta — e
   * mantém as três num tamanho parecido (≈1,45× o avatar). Buscar furo = 1,0
   * faz o enfeite crescer e ficar dominando a linha da lista de membros.
   */
  folga: string;
  /**
   * O trecho que vale a pena repetir, quando a arte tem uma ENTRADA.
   *
   * Muitas dessas animações começam com o desenho se montando — e no selo do
   * sol as asas nascem no meio e voam pros lados. Em laço, isso vira a asa
   * passando por cima da cara da pessoa a cada três segundos. Tocando só o
   * trecho depois da entrada, o desenho fica montado e só as faíscas continuam.
   */
  segmento?: [number, number];
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
  // anel simples, escrito à mão: o furo ocupa 84% do quadro
  aro: { arquivo: () => import("~/assets/decoracoes/aro.json"), folga: "-16%" },
  // moldura com asas e estrela: furo de 58% do quadro
  alada: {
    arquivo: () => import("~/assets/decoracoes/alada.json"),
    folga: "-24%",
  },
  /*
    Selo de sol. Veio num quadro de 1000×591 — uma tira larga com a arte no meio
    e sobra dos lados, que numa camada quadrada sairia deformada. Foi recortado
    pra 501×501 (a arte inteira, sem sobra) centrado no FURO e não no desenho: é
    o furo que precisa cair em cima da foto. Furo de 61% do quadro.
  */
  sol: {
    arquivo: () => import("~/assets/decoracoes/sol.json"),
    folga: "-22%",
    // 0→48 é as asas saindo do meio; o que interessa repetir é o resto
    segmento: [49, 145],
  },
  /*
    Chamas infernais. A primeira montada pelo `scripts/montar-animada.py`, e a
    primeira em WEBP — 288 KB, contra os 516 KB que o mesmo desenho pesaria em
    PNG. Numa loja de cem itens essa diferença é 50 MB contra 11.

    A arte veio numa folha só, sobre PRETO, com o aro desenhado DUAS VEZES, com
    o fogo em formatos diferentes. Os dois viraram quadro: o laço alterna entre
    eles, então a chama troca de forma em vez de a mesma imagem pulsar. É assim
    que fogo se anima; escalar e girar dá aquele efeito de adesivo tremendo.

    O alfa saiu da própria luminância (`tirar_o_preto` em `png.py`), e não de
    limiar: arte de brilho é somada sobre preto, então o brilho É o alfa. Com
    corte duro, a borda macia da chama vira serrilha.

    O centro do aro sai da SILHUETA EXTERNA, não do vão interno: um aro de
    labaredas separadas tem fresta entre elas, e a varredura horizontal escapa
    por uma fresta e mede um furo que não existe. Foi assim que ele nasceu 92px
    fora do lugar, pendurado abaixo da foto.

    A folga aqui foi ESCOLHIDA no olho, e não pela fórmula. A conta dá -24%, e
    ela pressupõe furo redondo — este não é: as labaredas entram mais pelas
    laterais que por cima, então o número da fórmula deixa um vão no topo. Nos
    -18% o fogo abraça a foto como na arte original.
  */
  caveiras: {
    arquivo: () => import("~/assets/decoracoes/caveiras.json"),
    folga: "-22%",
  },
};

export const ehAnimada = (decoracao: Decoracao | null | undefined): boolean =>
  Boolean(decoracao && decoracao in ARQUIVOS);

/**
 * Carrega o desenho. `null` quando o id não é de uma animada — quem chama usa
 * isso pra decidir entre o player e a camada de CSS.
 */
export async function carregarDecoracao(
  decoracao: Decoracao,
): Promise<unknown | null> {
  const animada = ARQUIVOS[decoracao];
  if (!animada) return null;

  return (await animada.arquivo()).default;
}

/** A folga desta decoração, ou a mesma da camada de CSS. */
export const folgaDaDecoracao = (decoracao: Decoracao): string =>
  ARQUIVOS[decoracao]?.folga ?? "-16%";

/** O trecho a repetir, quando a arte tem entrada que não deve voltar. */
export const segmentoDaDecoracao = (
  decoracao: Decoracao,
): [number, number] | undefined => ARQUIVOS[decoracao]?.segmento;
