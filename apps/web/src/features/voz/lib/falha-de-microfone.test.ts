import { describe, expect, it } from "vitest";

import { microphoneReactionFailure } from "./falha-de-microfone";

const error = (name: string, message = "") => Object.assign(new Error(message), { name: name });

const reconnecting = { reconnecting: true };

describe("reacaoAFalhaDeMicrofone", () => {
  it("sem erro, não há reação", () => {
    expect(microphoneReactionFailure(null)).toBe("ignorar");
    expect(microphoneReactionFailure(undefined)).toBe("ignorar");
  });

  it("permissão negada pede ação da pessoa", () => {
    expect(microphoneReactionFailure(error("NotAllowedError"))).toBe("mutar");
  });

  it("microfone ocupado por outro programa pede ação da pessoa", () => {
    expect(microphoneReactionFailure(error("NotReadableError"))).toBe("mutar");
  });

  it("máquina sem microfone pede ação da pessoa", () => {
    expect(microphoneReactionFailure(error("NotFoundError"))).toBe("mutar");
  });

  it("queda passageira só adia, sem acusar o microfone", () => {
    expect(microphoneReactionFailure(error("AbortError"))).toBe("adiar");
    expect(microphoneReactionFailure(error("UnexpectedConnectionState"))).toBe("adiar");
  });

  it("sala ainda não conectada adia, pela mensagem", () => {
    expect(microphoneReactionFailure(error("Error", "Room is not connected"))).toBe("adiar");
  });

  it("argumento errado é bug nosso e vai para o console", () => {
    expect(microphoneReactionFailure(error("TypeError"))).toBe("estourar");
  });

  it("falha desconhecida no meio de uma reconexão adia", () => {
    expect(microphoneReactionFailure(error("AlgoNovoDoLiveKit"), reconnecting)).toBe("adiar");
  });

  it("falha desconhecida fora de reconexão muta, que é o lado seguro", () => {
    expect(microphoneReactionFailure(error("AlgoNovoDoLiveKit"))).toBe("mutar");
  });

  it("permissão negada continua pedindo ação mesmo reconectando", () => {
    expect(microphoneReactionFailure(error("NotAllowedError"), reconnecting)).toBe("mutar");
  });

  it("bug nosso continua sendo bug nosso mesmo reconectando", () => {
    expect(microphoneReactionFailure(error("TypeError"), reconnecting)).toBe("estourar");
  });

  it("erro que não é Error não quebra a leitura", () => {
    expect(microphoneReactionFailure("not connected")).toBe("adiar");
    expect(microphoneReactionFailure({ name: "NotAllowedError" })).toBe("mutar");
    expect(microphoneReactionFailure(42)).toBe("mutar");
  });
});
