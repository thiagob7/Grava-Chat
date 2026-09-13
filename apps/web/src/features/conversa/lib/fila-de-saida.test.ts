import { describe, expect, it } from "vitest";

import { stopsWholeQueue, waitBeforeTry, worthQueueing } from "./fila-de-saida";

describe("o que vale guardar para tentar de novo", () => {
  it("rede caída volta sozinha, então guarda", () => {
    expect(worthQueueing("sem-conexao")).toBe(true);
  });

  it("modo lento e limite de fluxo passam com o tempo, então guardam", () => {
    expect(worthQueueing("modo-lento")).toBe(true);
    expect(worthQueueing("depressa")).toBe(true);
  });

  it("falta de permissão não muda por esperar, então falha na hora", () => {
    expect(worthQueueing("sem-permissao")).toBe(false);
    expect(worthQueueing("sem-acesso")).toBe(false);
    expect(worthQueueing("recusada")).toBe(false);
    expect(worthQueueing("automod")).toBe(false);
  });

  it("sem motivo nenhum não guarda: fila só para quem tem chance", () => {
    expect(worthQueueing(undefined)).toBe(false);
  });

  it("erro genérico não entra na fila, senão trava as mensagens de trás", () => {
    expect(worthQueueing("erro")).toBe(false);
  });
});

describe("espera entre tentativas", () => {
  it("a primeira sai na hora", () => {
    expect(waitBeforeTry(0)).toBe(0);
  });

  it("cada falha dobra a espera", () => {
    expect(waitBeforeTry(1)).toBe(1_000);
    expect(waitBeforeTry(2)).toBe(2_000);
    expect(waitBeforeTry(3)).toBe(4_000);
    expect(waitBeforeTry(4)).toBe(8_000);
  });

  it("para de dobrar no teto, senão a última tentativa levaria horas", () => {
    expect(waitBeforeTry(10)).toBe(30_000);
    expect(waitBeforeTry(50)).toBe(30_000);
  });
});

describe("o que para a fila inteira", () => {
  it("só a falta de rede", () => {
    expect(stopsWholeQueue("sem-conexao")).toBe(true);
    expect(stopsWholeQueue("modo-lento")).toBe(false);
    expect(stopsWholeQueue("depressa")).toBe(false);
  });
});
