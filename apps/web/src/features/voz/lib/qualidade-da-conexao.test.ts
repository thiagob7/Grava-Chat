import { describe, expect, it } from "vitest";

import { qualityNotice } from "./qualidade-da-conexao";

describe("avisoDeQualidade", () => {
  it("conexão boa não gera selo", () => {
    expect(qualityNotice("excellent")).toBeNull();
    expect(qualityNotice("good")).toBeNull();
  });

  it("quem acabou de entrar não é marcado como problema", () => {
    expect(qualityNotice("unknown")).toBeNull();
  });

  it("conexão instável avisa em amarelo, sem piscar", () => {
    const notice = qualityNotice("poor");

    expect(notice?.label).toBe("Conexão instável");
    expect(notice?.color).toBe("text-idle");
    expect(notice?.pulsing).toBe(false);
  });

  it("conexão perdida avisa em vermelho e pisca", () => {
    const notice = qualityNotice("lost");

    expect(notice?.label).toBe("Conexão perdida");
    expect(notice?.color).toBe("text-danger");
    expect(notice?.pulsing).toBe(true);
  });

  it("valor desconhecido do LiveKit não quebra nem inventa selo", () => {
    expect(qualityNotice("algo-novo-numa-versao-futura")).toBeNull();
  });
});
