import { describe, expect, it } from "vitest";

import { CHAVE_DA_SAIDA } from "~/features/configuracoes/lib/saida-de-emergencia";

/*
  O nome do parâmetro é contrato com quem está com o app quebrado: se ele
  mudar, o endereço que a pessoa guardou para de salvar.
*/
describe("saída de emergência", () => {
  it("mantém o nome do parâmetro", () => {
    expect(CHAVE_DA_SAIDA).toBe("sem-tema");
  });
});
