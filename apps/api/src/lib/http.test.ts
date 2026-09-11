import { describe, expect, it } from "vitest";

import { AppError, ConflictError, ForbiddenError, NotFoundError } from "./http.js";

describe("quem merece interromper a pessoa", () => {
  it("erro comum avisa", () => {
    expect(new AppError("Mensagem vazia").notify).toBe(true);
  });

  it("sem permissão avisa", () => {
    expect(new ForbiddenError().notify).toBe(true);
  });

  it("não encontrado avisa", () => {
    expect(new NotFoundError().notify).toBe(true);
  });

  it("conflito de estado NÃO avisa", () => {
    expect(new ConflictError("Você não está num canal de voz").notify).toBe(false);
  });

  it("dá pra silenciar um erro comum sem trocar de classe", () => {
    expect(new AppError("corrida", 400, false).notify).toBe(false);
  });
});
