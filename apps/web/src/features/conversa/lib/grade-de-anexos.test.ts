import { describe, expect, it } from "vitest";

import {
  attachmentsArrangement,
  itemColumns,
} from "~/features/conversa/lib/grade-de-anexos";

describe("grade de anexos", () => {
  it("não arruma uma imagem sozinha", () => {
    expect(attachmentsArrangement(0)).toBeNull();
    expect(attachmentsArrangement(1)).toBeNull();
  });

  it("tem arranjo para toda contagem de 2 a 10", () => {
    for (let n = 2; n <= 10; n++) expect(attachmentsArrangement(n)).not.toBeNull();
  });

  it("desiste acima de dez", () => {
    expect(attachmentsArrangement(11)).toBeNull();
    expect(attachmentsArrangement(40)).toBeNull();
  });

  it("só 7, 8 e 10 têm invólucro e fileira de cima", () => {
    const withTwoParts = [];

    for (let n = 2; n <= 10; n++) {
      const a = attachmentsArrangement(n);
      if (a?.outside) withTwoParts.push(n);
      expect(Boolean(a?.outside)).toBe(a?.inUp !== undefined);
    }

    expect(withTwoParts).toEqual([7, 8, 10]);
  });

  it("o resto de baixo fecha em fileiras cheias", () => {
    for (const n of [7, 8, 10]) {
      const a = attachmentsArrangement(n)!;
      expect((n - a.inUp!) % a.columns).toBe(0);
    }
  });

  it("cinco é o único que estica item, e fecha a linha", () => {
    for (let n = 2; n <= 10; n++) {
      const a = attachmentsArrangement(n)!;
      const items = a.inUp === undefined ? n : n - a.inUp;
      const first = Array.from({ length: items }, (_, i) => itemColumns(n, i));

      if (n !== 5) expect(new Set(first)).toEqual(new Set([1]));
      else expect(first).toEqual([3, 3, 2, 2, 2]);
    }
  });

  it("nomeia um lugar diferente para cada arranjo", () => {
    const names = [];
    for (let n = 2; n <= 10; n++) {
      const a = attachmentsArrangement(n)!;
      names.push(a.grid);
      if (a.outside) names.push(a.outside);
    }

    expect(new Set(names).size).toBe(names.length);
  });
});
