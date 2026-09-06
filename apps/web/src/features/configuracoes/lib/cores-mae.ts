import Color from "color";

import mapa from "~/features/configuracoes/lib/cores-mae.json";

/*
  Uma cor-mãe e as filhas que andam com ela.

  Trocar 41 cores uma a uma não é fazer tema, é preencher formulário. Aqui se
  escolhe quatro cores e o resto vem junto: superfícies, hover, bordas, campo,
  painel — e o palco de voz, que era justamente a ilha que nenhum tema
  alcançava.

  As distâncias saem do `index.css` por `scripts/cores-mae.mjs`, medidas no
  tema base. Por isso derivar sem mexer em nada devolve o tema de hoje, cor por
  cor: a derivação começa sendo a identidade, e é isso que a torna conferível.
  Há um teste que cobra exatamente essa igualdade.
*/
export interface FilhaDeCor {
  nome: string;
  /// Distância de luminosidade até a mãe, em LCh — onde o L é perceptual.
  dL: number;
  /// A saturação anda em proporção: mãe cinza, filhas cinzas.
  razaoC: number;
  /// O giro de matiz que a filha guarda em relação à mãe.
  dH: number;
  alfa: number | null;
  /// Vira do avesso quando a mãe troca de lado, de escuro para claro.
  espelha?: boolean;
  /// Não é degrau da rampa: é o polo oposto ao da mãe.
  contraste?: boolean;
  /// Preto ou branco absoluto — véu, sombra, brilho. Segue só o matiz da mãe.
  ancora?: boolean;
  /// A luminosidade fixa de quem é âncora ou contraste.
  L?: number;
}

export interface FamiliaDeCor {
  rotulo: string;
  dica: string;
  mae: string;
  padrao: string;
  filhas: FilhaDeCor[];
}

export const CORES_MAE = mapa as Record<string, FamiliaDeCor>;

export const MAES = Object.keys(CORES_MAE);

/*
  O mesmo piso do gerador. Sem ele, uma mãe quase neutra faria a razão de
  saturação explodir; com ele nos dois lados, derivar o padrão devolve o padrão.
*/
const PISO_DE_CROMA = 3;
const TETO_DE_CROMA = 132;

/// Acima disto a cor é "clara". É o meio da escala perceptual, não um chute.
const MEIO = 50;

/// O tipo do objeto que o `color` devolve — ele exporta a função, não o tipo.
type Cor = ReturnType<typeof Color>;

const entre = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function escrever(cor: Cor, alfa: number | null): string {
  if (alfa === null) return cor.hex().toLowerCase();

  const [r = 0, g = 0, b = 0] = cor.rgb().array().map(Math.round);
  return `rgb(${r} ${g} ${b} / ${alfa})`;
}

/*
  O degrau, medido como FRAÇÃO do espaço que há naquela direção — não em valor
  absoluto. É aqui que a rampa ganha a curva.

  O link do tema base é 42 pontos mais claro que a marca, porque a marca é um
  índigo escuro. Somar 42 numa marca clara jogava o link em branco puro: some
  do fundo, e quem escolheu um laranja bonito ficou sem link. Como fração, ele
  usa a mesma PROPORÇÃO do que sobra até o branco, e continua sendo "bem mais
  claro que a marca" em qualquer marca.

  No padrão a mãe está onde foi medida, as duas frações são iguais e a conta
  vira a soma de antes — a derivação continua sendo a identidade.
*/
function escalar(dL: number, inverte: boolean, maeL: number, padraoL: number) {
  const alvo = inverte ? -dL : dL;
  const espacoNovo = alvo > 0 ? 100 - maeL : maeL;
  const espacoBase = dL > 0 ? 100 - padraoL : padraoL;

  return maeL + alvo * (espacoNovo / Math.max(espacoBase, 1));
}

/*
  As cores que uma mãe gera.

  `fator` multiplica a saturação de todas as filhas de uma vez — é o
  `--saturation-factor` da referência, e serve de acessibilidade: 0 entrega o
  app inteiro em cinza sem recompilar nada.
*/
export function derivar(
  id: string,
  escolhida: string,
  fator = 1,
): Record<string, string> {
  const familia = CORES_MAE[id];
  if (!familia) return {};

  let mae: Cor;
  try {
    mae = Color(escolhida);
  } catch {
    return {};
  }

  const [maeL = 0, maeC = 0, maeH = 0] = mae.lch().array();
  const [padraoL = 0] = Color(familia.padrao).lch().array();

  const virou = maeL > MEIO !== padraoL > MEIO;

  /*
    O fator vale para a mãe também. Se a marca ficasse berrante enquanto as
    filhas empalidecem, o controle não serviria para o que existe: em 0 o app
    inteiro tem que ficar cinza, e o botão faz parte do app.
  */
  const saida: Record<string, string> = {
    [familia.mae]: escrever(
      Color.lch(maeL, entre(maeC * fator, 0, TETO_DE_CROMA), maeH),
      mae.alpha() < 1 ? Number(mae.alpha().toFixed(4)) : null,
    ),
  };

  for (const filha of familia.filhas) {
    /*
      A filha de contraste sempre vira quando a mãe troca de lado: ela É o lado
      oposto. A âncora nunca vira: um véu branco não escurece nada.
    */
    const inverte =
      !filha.ancora &&
      (Boolean(filha.espelha) || Boolean(filha.contraste)) &&
      virou;

    const L =
      filha.L === undefined
        ? escalar(filha.dL, inverte, maeL, padraoL)
        : inverte
          ? 100 - filha.L
          : filha.L;

    const C = Math.max(maeC, PISO_DE_CROMA) * filha.razaoC * fator;
    const H = (((maeH + filha.dH) % 360) + 360) % 360;

    saida[filha.nome] = escrever(
      Color.lch(entre(L, 0, 100), entre(C, 0, TETO_DE_CROMA), H),
      filha.alfa,
    );
  }

  return saida;
}

/// Todo token que alguma mãe pinta — o estúdio marca esses como derivados.
export const TOKENS_DERIVADOS = new Set(
  Object.values(CORES_MAE).flatMap((f) => [
    f.mae,
    ...f.filhas.map((c) => c.nome),
  ]),
);

/*
  O tema inteiro: as filhas de cada mãe, e por cima o que foi mexido à mão.

  A ordem é a regra. Quem abriu um token e escolheu a cor não pode ver a
  derivação desmanchar a escolha no clique seguinte — e é o que aconteceria se
  as duas fontes fossem misturadas em vez de empilhadas.
*/
export function montarTema(
  coresMae: Record<string, string>,
  saturacao: number,
  manuais: Record<string, string>,
): Record<string, string> {
  const derivadas: Record<string, string> = {};

  for (const [id, cor] of Object.entries(coresMae)) {
    Object.assign(derivadas, derivar(id, cor, saturacao));
  }

  return { ...derivadas, ...manuais };
}

/*
  O que o tema não disse, deduzido do que ele disse.

  Um tema de fora é escrito contra a árvore de OUTRO app e cobre o vocabulário
  daquele app — não o nosso. Por mais que a ponte cresça, ele nunca vai falar
  de `--color-palco`, `--color-veu` ou `--color-line-sutil`: esses nomes não
  existem no mundo dele. Sem isto, o resultado é um app metade pintado, com o
  miolo do tema e as bordas de fábrica — que é exatamente a queixa de "importei
  e quase nada mudou".

  Então cada mãe cuja cor o tema declarou gera as filhas que ele deixou de
  fora. O que ele disse com todas as letras nunca é tocado.
*/
export function completarComDerivacao(
  traduzidos: Record<string, string>,
  saturacao = 1,
): Record<string, string> {
  const saida: Record<string, string> = {};

  for (const id of MAES) {
    const familia = CORES_MAE[id];
    const cor = familia && traduzidos[familia.mae];
    if (!cor) continue;

    for (const [nome, valor] of Object.entries(derivar(id, cor, saturacao))) {
      if (nome in traduzidos) continue;
      saida[nome] = valor;
    }
  }

  return saida;
}
