import { describe, expect, it } from "vitest";

import { AppError, ConflictError, ForbiddenError, NotFoundError } from "./http.js";

describe("quem merece interromper a pessoa", () => {
  it("erro comum avisa", () => {
    expect(new AppError("Mensagem vazia").avisar).toBe(true);
  });

  it("sem permissão avisa", () => {
    expect(new ForbiddenError().avisar).toBe(true);
  });

  it("não encontrado avisa", () => {
    expect(new NotFoundError().avisar).toBe(true);
  });

  it("conflito de estado NÃO avisa", () => {
    expect(new ConflictError("Você não está num canal de voz").avisar).toBe(false);
  });

  it("dá pra silenciar um erro comum sem trocar de classe", () => {
    expect(new AppError("corrida", 400, false).avisar).toBe(false);
  });
});
