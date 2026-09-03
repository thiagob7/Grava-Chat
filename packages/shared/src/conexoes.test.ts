import { describe, expect, it } from "vitest";

import { comoSeLe, enderecoDaConexao } from "./conexoes.js";

describe("endereço da conexão", () => {
  it("monta o endereço do serviço a partir do nome de usuário", () => {
    expect(enderecoDaConexao({ servico: "github", valor: "thiagob7" })).toBe(
      "https://github.com/thiagob7",
    );
    expect(enderecoDaConexao({ servico: "youtube", valor: "canal" })).toBe(
      "https://youtube.com/@canal",
    );
  });

  it("aceita o @ que a pessoa digita por hábito", () => {
    expect(enderecoDaConexao({ servico: "x", valor: "@alguem" })).toBe(
      "https://x.com/alguem",
    );
  });

  /*
    O handle vira parte de uma URL, então tudo que serve para escapar do molde
    tem que morrer aqui. Sem isto, "thiagob7/../../evil.com" e um handle com
    dois pontos viram um link que aponta para outro lugar.
  */
  it("recusa nome de usuário que escapa do molde", () => {
    expect(
      enderecoDaConexao({ servico: "github", valor: "a/../b" }),
    ).toBeNull();
    expect(enderecoDaConexao({ servico: "github", valor: "a b" })).toBeNull();
    expect(
      enderecoDaConexao({ servico: "github", valor: "javascript:alert(1)" }),
    ).toBeNull();
    expect(enderecoDaConexao({ servico: "github", valor: "" })).toBeNull();
  });

  it("completa o site com https quando falta", () => {
    expect(enderecoDaConexao({ servico: "site", valor: "gravae.io" })).toBe(
      "https://gravae.io/",
    );
  });

  /*
    Link de perfil é clicável na máquina de outra pessoa. `javascript:` ali é
    execução de código, e `data:` é o mesmo por outro caminho — os dois passam
    por qualquer comparação ingênua de começo de texto, e por isso quem decide
    é o `URL`, que lê o protocolo de verdade.
  */
  it("não deixa o site virar um esquema perigoso", () => {
    expect(
      enderecoDaConexao({ servico: "site", valor: "javascript:alert(1)" }),
    ).toBeNull();
    expect(
      enderecoDaConexao({ servico: "site", valor: "JaVaScRiPt:alert(1)" }),
    ).toBeNull();
    expect(
      enderecoDaConexao({ servico: "site", valor: "data:text/html,<b>" }),
    ).toBeNull();
  });

  it("recusa site sem domínio de verdade", () => {
    expect(
      enderecoDaConexao({ servico: "site", valor: "localhost" }),
    ).toBeNull();
  });
});

describe("como a conexão é escrita", () => {
  it("mostra o handle sem o arroba", () => {
    expect(comoSeLe({ servico: "x", valor: "@alguem" })).toBe("alguem");
  });

  /// Cinco linhas de `https://` uma embaixo da outra não dizem nada.
  it("mostra só o domínio do site", () => {
    expect(
      comoSeLe({ servico: "site", valor: "https://gravae.io/sobre" }),
    ).toBe("gravae.io");
    expect(comoSeLe({ servico: "site", valor: "gravae.io" })).toBe("gravae.io");
  });
});
