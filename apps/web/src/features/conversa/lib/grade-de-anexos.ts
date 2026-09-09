import type { Lugares } from "~/lib/compat-de-tema";

export interface ArranjoDeAnexos {
  fora?: Lugares;
  grade: Lugares;
  colunas: number;
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

export function arranjoDeAnexos(quantas: number): ArranjoDeAnexos | null {
  return ARRANJOS[quantas] ?? null;
}

export function colunasDoItem(quantas: number, indice: number): number {
  if (quantas !== 5) return 1;
  return indice < 2 ? 3 : 2;
}
