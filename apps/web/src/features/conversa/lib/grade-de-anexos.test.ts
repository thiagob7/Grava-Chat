import { describe, expect, it } from "vitest";

import {
  arranjoDeAnexos,
  colunasDoItem,
} from "~/features/conversa/lib/grade-de-anexos";

describe("grade de anexos", () => {
  it("não arruma uma imagem sozinha", () => {
    expect(arranjoDeAnexos(0)).toBeNull();
    expect(arranjoDeAnexos(1)).toBeNull();
  });

  it("tem arranjo para toda contagem de 2 a 10", () => {
    for (let n = 2; n <= 10; n++) expect(arranjoDeAnexos(n)).not.toBeNull();
  });

  /*
    Acima de dez o desenho por contagem perde a graça: viram fileiras de três,
    que é o que a `flex-wrap` já entregava.
  */
  it("desiste acima de dez", () => {
    expect(arranjoDeAnexos(11)).toBeNull();
    expect(arranjoDeAnexos(40)).toBeNull();
  });

  it("só 7, 8 e 10 têm invólucro e fileira de cima", () => {
    const comDuasPartes = [];

    for (let n = 2; n <= 10; n++) {
      const a = arranjoDeAnexos(n);
      if (a?.fora) comDuasPartes.push(n);
      // invólucro e fileira de cima andam juntos, sempre
      expect(Boolean(a?.fora)).toBe(a?.emCima !== undefined);
    }

    expect(comDuasPartes).toEqual([7, 8, 10]);
  });

  /*
    A conta que faz o desenho fechar: o que sobra depois da fileira de cima tem
    que caber inteiro em fileiras completas da grade de baixo.
  */
  it("o resto de baixo fecha em fileiras cheias", () => {
    for (const n of [7, 8, 10]) {
      const a = arranjoDeAnexos(n)!;
      expect((n - a.emCima!) % a.colunas).toBe(0);
    }
  });

  it("cinco é o único que estica item, e fecha a linha", () => {
    for (let n = 2; n <= 10; n++) {
      const a = arranjoDeAnexos(n)!;
      const itens = a.emCima === undefined ? n : n - a.emCima;
      const primeiros = Array.from({ length: itens }, (_, i) => colunasDoItem(n, i));

      if (n !== 5) expect(new Set(primeiros)).toEqual(new Set([1]));
      else expect(primeiros).toEqual([3, 3, 2, 2, 2]);
    }
  });

  it("nomeia um lugar diferente para cada arranjo", () => {
    const nomes = [];
    for (let n = 2; n <= 10; n++) {
      const a = arranjoDeAnexos(n)!;
      nomes.push(a.grade);
      if (a.fora) nomes.push(a.fora);
    }

    expect(new Set(nomes).size).toBe(nomes.length);
  });
});
