import { describe, expect, it } from "vitest";

import { OUTPUT_KEY } from "~/features/configuracoes/lib/saida-de-emergencia";

describe("saída de emergência", () => {
  it("mantém o nome do parâmetro", () => {
    expect(OUTPUT_KEY).toBe("sem-tema");
  });
});
