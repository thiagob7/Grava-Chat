import { describe, expect, it } from "vitest";

import { CHAVE_DA_SAIDA } from "~/features/configuracoes/lib/saida-de-emergencia";

describe("saída de emergência", () => {
  it("mantém o nome do parâmetro", () => {
    expect(CHAVE_DA_SAIDA).toBe("sem-tema");
  });
});
