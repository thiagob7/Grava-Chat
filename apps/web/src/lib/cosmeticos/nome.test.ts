import { describe, expect, it } from "vitest";

import { estiloDoCargo, corDoCargoMaisAlto } from "./cargo";
import { estiloDoNome } from "./nome";

const AZUL = "#3b82f6";
const ROSA = "#ec4899";

describe("estilo do nome — a promessa da Fase 0", () => {
  it("sem enfeite e sem cargo colorido, não sai classe nem style", () => {
    expect(estiloDoNome({})).toEqual({ className: undefined, style: undefined });
  });

  it("perfil vazio é tratado como quem nunca mexeu", () => {
    expect(estiloDoNome({ estilo: null, corDoCargo: null })).toEqual({
      className: undefined,
      style: undefined,
    });
  });
});

describe("precedência cargo × usuário", () => {
  it("a cor sólida do cargo vence a cor do usuário", () => {
    const { style } = estiloDoNome({ estilo: { cor: ROSA }, corDoCargo: AZUL });

    expect(style?.color).toBe(AZUL);
  });

  it("sem cargo colorido, a cor do usuário aparece", () => {
    const { style } = estiloDoNome({ estilo: { cor: ROSA } });

    expect(style?.color).toBe(ROSA);
  });

  it("o efeito é do usuário, e a cor dele manda dentro do efeito", () => {
    const { className, style } = estiloDoNome({
      estilo: { efeito: "neon", cor: ROSA },
      corDoCargo: AZUL,
    });

    expect(className).toBe("gc-nome--neon");
    expect(style?.["--gc-cor-1"]).toBe(ROSA);
  });

  it("efeito sem cor escolhida herda a cor do cargo — a hierarquia sobrevive", () => {
    const { style } = estiloDoNome({ estilo: { efeito: "neon" }, corDoCargo: AZUL });

    expect(style?.["--gc-cor-1"]).toBe(AZUL);
  });

  it("efeito sem cor nenhuma não inventa cor: o CSS decide", () => {
    const { className, style } = estiloDoNome({ estilo: { efeito: "neon" } });

    expect(className).toBe("gc-nome--neon");
    expect(style).toBeUndefined();
  });
});

describe("legibilidade", () => {
  it("a cor do cargo também passa pelo piso de contraste", () => {
    const { style } = estiloDoNome({ corDoCargo: "#2a0a4a" });

    expect(style?.color).not.toBe("#2a0a4a");
  });
});

describe("tamanho", () => {
  it("em `sm`, gradiente cai pra cor sólida — o recorte come o antialiasing", () => {
    const { className, style } = estiloDoNome({
      estilo: { efeito: "gradiente", cor: ROSA },
      tamanho: "sm",
    });

    expect(className).toBeUndefined();
    expect(style?.color).toBe(ROSA);
  });

  it("no rebaixamento, a cor de quem escolheu o gradiente sobrevive ao cargo", () => {
    const { style } = estiloDoNome({
      estilo: { efeito: "gradiente", cor: ROSA },
      corDoCargo: AZUL,
      tamanho: "sm",
    });

    expect(style?.color).toBe(ROSA);
  });

  it("em `md`, o gradiente vale", () => {
    const { className, style } = estiloDoNome({
      estilo: { efeito: "gradiente", cor: ROSA, cor2: AZUL },
      tamanho: "md",
    });

    expect(className).toBe("gc-nome--gradiente");
    expect(style?.["--gc-cor-1"]).toBe(ROSA);
    expect(style?.["--gc-cor-2"]).toBe(AZUL);
  });

  it("neon vale em qualquer tamanho: não recorta o texto", () => {
    expect(estiloDoNome({ estilo: { efeito: "neon" }, tamanho: "sm" }).className).toBe(
      "gc-nome--neon",
    );
  });
});

describe("animação", () => {
  it("parado por padrão: cem nomes animados numa lista engasgam a rolagem", () => {
    const { style } = estiloDoNome({ estilo: { efeito: "neon", cor: ROSA } });

    expect(style?.["--gc-vel"]).toBeUndefined();
  });

  it("o cartão de perfil pede movimento explicitamente", () => {
    const { style } = estiloDoNome({ estilo: { efeito: "neon", cor: ROSA }, animar: true });

    expect(style?.["--gc-vel"]).toBeTruthy();
  });
});

describe("fonte", () => {
  it("`padrao` não vira nada", () => {
    expect(estiloDoNome({ estilo: { fonte: "padrao" } })).toEqual({
      className: undefined,
      style: undefined,
    });
  });

  it("fonte decorativa vira classe mais família, com queda pra fonte do app", () => {
    const { className, style } = estiloDoNome({ estilo: { fonte: "manuscrita" } });

    expect(className).toBe("gc-fonte");
    expect(String(style?.["--gc-fonte"])).toContain("Caveat");
  });
});

const cargo = (id: string, position: number, color: string | null) => ({
  id,
  guildId: "a".repeat(24),
  name: id,
  color,
  colorSecondary: null,
  iconUrl: null,
  iconEmoji: null,
  estilo: "solido" as const,
  position,
  permissions: [],
  hoist: false,
  mentionable: false,
  isEveryone: false,
});

describe("cor do cargo mais alto", () => {
  const cargos = [cargo("baixo", 1, AZUL), cargo("alto", 5, ROSA), cargo("sem-cor", 9, null)];

  it("pega o mais alto entre os que a pessoa tem", () => {
    expect(corDoCargoMaisAlto(["baixo", "alto"], cargos)).toBe(ROSA);
  });

  it("cargo sem cor não pinta, e a busca continua no de baixo", () => {
    expect(corDoCargoMaisAlto(["baixo", "sem-cor"], cargos)).toBe(AZUL);
  });

  it("sem cargo nenhum, sem cor", () => {
    expect(corDoCargoMaisAlto([], cargos)).toBeNull();
  });
});

describe("estilo do cargo", () => {
  it("gradiente sem a segunda cor cai pra sólido em vez de sumir", () => {
    const { className, style } = estiloDoCargo(
      { color: AZUL, colorSecondary: null, estilo: "gradiente" },
      { tamanho: "md" },
    );

    expect(className).toBeUndefined();
    expect(style?.color).toBe(AZUL);
  });

  it("com as duas cores em tamanho grande, o gradiente vale", () => {
    const { className } = estiloDoCargo(
      { color: AZUL, colorSecondary: ROSA, estilo: "gradiente" },
      { tamanho: "md" },
    );

    expect(className).toBe("gc-cargo--gradiente");
  });

  it("holográfico vale em tamanho pequeno: anima a cor, não recorta o texto", () => {
    const { className } = estiloDoCargo({
      color: AZUL,
      colorSecondary: ROSA,
      estilo: "holografico",
    });

    expect(className).toBe("gc-cargo--holografico");
  });
});
