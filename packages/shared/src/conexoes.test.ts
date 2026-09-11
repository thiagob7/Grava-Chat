import { describe, expect, it } from "vitest";

import { asLe, connectionAddress } from "./conexoes.js";

describe("endereço da conexão", () => {
  it("monta o endereço do serviço a partir do nome de usuário", () => {
    expect(connectionAddress({ service: "github", value: "thiagob7" })).toBe(
      "https://github.com/thiagob7",
    );
    expect(connectionAddress({ service: "youtube", value: "canal" })).toBe(
      "https://youtube.com/@canal",
    );
  });

  it("aceita o @ que a pessoa digita por hábito", () => {
    expect(connectionAddress({ service: "x", value: "@alguem" })).toBe(
      "https://x.com/alguem",
    );
  });

  it("recusa nome de usuário que escapa do molde", () => {
    expect(
      connectionAddress({ service: "github", value: "a/../b" }),
    ).toBeNull();
    expect(connectionAddress({ service: "github", value: "a b" })).toBeNull();
    expect(
      connectionAddress({ service: "github", value: "javascript:alert(1)" }),
    ).toBeNull();
    expect(connectionAddress({ service: "github", value: "" })).toBeNull();
  });

  it("completa o site com https quando falta", () => {
    expect(connectionAddress({ service: "site", value: "exemplo.com" })).toBe(
      "https://exemplo.com/",
    );
  });

  it("não deixa o site virar um esquema perigoso", () => {
    expect(
      connectionAddress({ service: "site", value: "javascript:alert(1)" }),
    ).toBeNull();
    expect(
      connectionAddress({ service: "site", value: "JaVaScRiPt:alert(1)" }),
    ).toBeNull();
    expect(
      connectionAddress({ service: "site", value: "data:text/html,<b>" }),
    ).toBeNull();
  });

  it("recusa site sem domínio de verdade", () => {
    expect(
      connectionAddress({ service: "site", value: "localhost" }),
    ).toBeNull();
  });
});

describe("como a conexão é escrita", () => {
  it("mostra o handle sem o arroba", () => {
    expect(asLe({ service: "x", value: "@alguem" })).toBe("alguem");
  });

  it("mostra só o domínio do site", () => {
    expect(
      asLe({ service: "site", value: "https://exemplo.com/sobre" }),
    ).toBe("exemplo.com");
    expect(asLe({ service: "site", value: "exemplo.com" })).toBe("exemplo.com");
  });
});
