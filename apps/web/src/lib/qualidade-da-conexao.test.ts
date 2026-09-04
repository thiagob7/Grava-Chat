import { describe, expect, it } from "vitest";

import { avisoDeQualidade } from "./qualidade-da-conexao";

describe("avisoDeQualidade", () => {
  it("conexão boa não gera selo", () => {
    expect(avisoDeQualidade("excellent")).toBeNull();
    expect(avisoDeQualidade("good")).toBeNull();
  });

  it("quem acabou de entrar não é marcado como problema", () => {
    expect(avisoDeQualidade("unknown")).toBeNull();
  });

  it("conexão instável avisa em amarelo, sem piscar", () => {
    const aviso = avisoDeQualidade("poor");

    expect(aviso?.rotulo).toBe("Conexão instável");
    expect(aviso?.cor).toBe("text-idle");
    expect(aviso?.pulsando).toBe(false);
  });

  it("conexão perdida avisa em vermelho e pisca", () => {
    const aviso = avisoDeQualidade("lost");

    expect(aviso?.rotulo).toBe("Conexão perdida");
    expect(aviso?.cor).toBe("text-danger");
    expect(aviso?.pulsando).toBe(true);
  });

  it("valor desconhecido do LiveKit não quebra nem inventa selo", () => {
    expect(avisoDeQualidade("algo-novo-numa-versao-futura")).toBeNull();
  });
});
