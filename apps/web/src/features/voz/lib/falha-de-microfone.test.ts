import { describe, expect, it } from "vitest";

import { reacaoAFalhaDeMicrofone } from "./falha-de-microfone";

const erro = (nome: string, mensagem = "") => Object.assign(new Error(mensagem), { name: nome });

const reconectando = { reconectando: true };

describe("reacaoAFalhaDeMicrofone", () => {
  it("sem erro, não há reação", () => {
    expect(reacaoAFalhaDeMicrofone(null)).toBe("ignorar");
    expect(reacaoAFalhaDeMicrofone(undefined)).toBe("ignorar");
  });

  it("permissão negada pede ação da pessoa", () => {
    expect(reacaoAFalhaDeMicrofone(erro("NotAllowedError"))).toBe("mutar");
  });

  it("microfone ocupado por outro programa pede ação da pessoa", () => {
    expect(reacaoAFalhaDeMicrofone(erro("NotReadableError"))).toBe("mutar");
  });

  it("máquina sem microfone pede ação da pessoa", () => {
    expect(reacaoAFalhaDeMicrofone(erro("NotFoundError"))).toBe("mutar");
  });

  it("queda passageira só adia, sem acusar o microfone", () => {
    expect(reacaoAFalhaDeMicrofone(erro("AbortError"))).toBe("adiar");
    expect(reacaoAFalhaDeMicrofone(erro("UnexpectedConnectionState"))).toBe("adiar");
  });

  it("sala ainda não conectada adia, pela mensagem", () => {
    expect(reacaoAFalhaDeMicrofone(erro("Error", "Room is not connected"))).toBe("adiar");
  });

  it("argumento errado é bug nosso e vai para o console", () => {
    expect(reacaoAFalhaDeMicrofone(erro("TypeError"))).toBe("estourar");
  });

  /*
    O caso que motivou o módulo: durante uma reconexão, uma falha que não
    sabemos ler não pode virar "microfone bloqueado" — a pessoa ia procurar um
    problema que não existe, e ele some sozinho quando a rede volta.
  */
  it("falha desconhecida no meio de uma reconexão adia", () => {
    expect(reacaoAFalhaDeMicrofone(erro("AlgoNovoDoLiveKit"), reconectando)).toBe("adiar");
  });

  it("falha desconhecida fora de reconexão muta, que é o lado seguro", () => {
    expect(reacaoAFalhaDeMicrofone(erro("AlgoNovoDoLiveKit"))).toBe("mutar");
  });

  /*
    Permissão e aparelho não mudam porque a rede caiu. Escondê-los durante a
    reconexão só adiaria a descoberta para o momento em que a pessoa já achava
    que estava tudo certo.
  */
  it("permissão negada continua pedindo ação mesmo reconectando", () => {
    expect(reacaoAFalhaDeMicrofone(erro("NotAllowedError"), reconectando)).toBe("mutar");
  });

  it("bug nosso continua sendo bug nosso mesmo reconectando", () => {
    expect(reacaoAFalhaDeMicrofone(erro("TypeError"), reconectando)).toBe("estourar");
  });

  it("erro que não é Error não quebra a leitura", () => {
    expect(reacaoAFalhaDeMicrofone("not connected")).toBe("adiar");
    expect(reacaoAFalhaDeMicrofone({ name: "NotAllowedError" })).toBe("mutar");
    expect(reacaoAFalhaDeMicrofone(42)).toBe("mutar");
  });
});
