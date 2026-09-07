import type { Lugares } from "~/lib/compat-de-tema";

/*
  Como arrumar de 2 a 10 imagens numa mensagem.

  Uma imagem sozinha vai no tamanho dela. A partir de duas, sair jogando lado a
  lado com `flex-wrap` faz a última fila ficar torta e a mensagem crescer sem
  controle — quanto mais imagem, pior. A referência resolve com um desenho por
  contagem, e tem um nome para cada um deles; os temas pintam esses nomes.

  Três contagens são de dois níveis: 7, 8 e 10 põem uma fileira em cima e uma
  grade embaixo. É por isso que existem `sevenImageContainer` e companhia — o
  invólucro é um elemento, a grade de baixo é outro.

  Aqui só o recorte. Quem desenha é o componente, e quem pinta é o tema.
*/

export interface ArranjoDeAnexos {
  /// O invólucro, quando o arranjo tem duas partes.
  fora?: Lugares;
  /// A grade — de baixo, quando há `emCima`.
  grade: Lugares;
  colunas: number;
  /// Quantas imagens vão na fileira de cima. Ausente quando é uma grade só.
  emCima?: number;
}

const ARRANJOS: Record<number, ArranjoDeAnexos> = {
  2: { grade: "gradeDeDuas", colunas: 2 },
  3: { grade: "gradeDeTres", colunas: 3 },
  4: { grade: "gradeDeQuatro", colunas: 2 },
  5: { grade: "gradeDeCinco", colunas: 6 },
  6: { grade: "gradeDeSeis", colunas: 3 },
  7: { fora: "caixaDeSete", grade: "gradeDeSete", colunas: 3, emCima: 1 },
  8: { fora: "caixaDeOito", grade: "gradeDeOito", colunas: 3, emCima: 2 },
  9: { grade: "gradeDeNove", colunas: 3 },
  10: { fora: "caixaDeDez", grade: "gradeDeDez", colunas: 3, emCima: 1 },
};

/*
  Fora da faixa não há arranjo: uma imagem é uma imagem, e acima de dez o
  desenho por contagem deixa de fazer sentido — vira uma grade de três colunas
  e pronto, que é o que a `flex-wrap` já fazia.
*/
export function arranjoDeAnexos(quantas: number): ArranjoDeAnexos | null {
  return ARRANJOS[quantas] ?? null;
}

/*
  Cinco é o único que precisa de span: duas em cima e três embaixo numa grade
  de seis colunas dá 3+3 e 2+2+2. Nos outros, cada imagem ocupa uma célula.
*/
export function colunasDoItem(quantas: number, indice: number): number {
  if (quantas !== 5) return 1;
  return indice < 2 ? 3 : 2;
}
