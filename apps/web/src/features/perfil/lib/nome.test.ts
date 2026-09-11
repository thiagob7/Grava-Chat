import { describe, expect, it } from "vitest";

import { roleStyle, roleMoreHighColor } from "./cargo";
import { nameStyle } from "./nome";

const BLUE = "#3b82f6";
const ROSA = "#ec4899";

describe("estilo do nome — a promessa da Fase 0", () => {
  it("sem enfeite e sem cargo colorido, não sai classe nem style", () => {
    expect(nameStyle({})).toEqual({ className: undefined, style: undefined });
  });

  it("perfil vazio é tratado como quem nunca mexeu", () => {
    expect(nameStyle({ style: null, roleColor: null })).toEqual({
      className: undefined,
      style: undefined,
    });
  });
});

describe("precedência cargo × usuário", () => {
  it("a cor sólida do cargo vence a cor do usuário", () => {
    const { style } = nameStyle({ style: { color: ROSA }, roleColor: BLUE });

    expect(style?.color).toBe(BLUE);
  });

  it("sem cargo colorido, a cor do usuário aparece", () => {
    const { style } = nameStyle({ style: { color: ROSA } });

    expect(style?.color).toBe(ROSA);
  });

  it("o efeito é do usuário, e a cor dele manda dentro do efeito", () => {
    const { className, style } = nameStyle({
      style: { effect: "neon", color: ROSA },
      roleColor: BLUE,
    });

    expect(className).toBe("gc-nome--neon");
    expect(style?.["--gc-cor-1"]).toBe(ROSA);
  });

  it("efeito sem cor escolhida herda a cor do cargo — a hierarquia sobrevive", () => {
    const { style } = nameStyle({ style: { effect: "neon" }, roleColor: BLUE });

    expect(style?.["--gc-cor-1"]).toBe(BLUE);
  });

  it("efeito sem cor nenhuma não inventa cor: o CSS decide", () => {
    const { className, style } = nameStyle({ style: { effect: "neon" } });

    expect(className).toBe("gc-nome--neon");
    expect(style).toBeUndefined();
  });
});

describe("legibilidade", () => {
  it("a cor do cargo também passa pelo piso de contraste", () => {
    const { style } = nameStyle({ roleColor: "#2a0a4a" });

    expect(style?.color).not.toBe("#2a0a4a");
  });
});

describe("tamanho", () => {
  it("em `sm`, gradiente cai pra cor sólida — o recorte come o antialiasing", () => {
    const { className, style } = nameStyle({
      style: { effect: "gradiente", color: ROSA },
      size: "sm",
    });

    expect(className).toBeUndefined();
    expect(style?.color).toBe(ROSA);
  });

  it("no rebaixamento, a cor de quem escolheu o gradiente sobrevive ao cargo", () => {
    const { style } = nameStyle({
      style: { effect: "gradiente", color: ROSA },
      roleColor: BLUE,
      size: "sm",
    });

    expect(style?.color).toBe(ROSA);
  });

  it("em `md`, o gradiente vale", () => {
    const { className, style } = nameStyle({
      style: { effect: "gradiente", color: ROSA, color2: BLUE },
      size: "md",
    });

    expect(className).toBe("gc-nome--gradiente");
    expect(style?.["--gc-cor-1"]).toBe(ROSA);
    expect(style?.["--gc-cor-2"]).toBe(BLUE);
  });

  it("neon vale em qualquer tamanho: não recorta o texto", () => {
    expect(nameStyle({ style: { effect: "neon" }, size: "sm" }).className).toBe(
      "gc-nome--neon",
    );
  });
});

describe("animação", () => {
  it("parado por padrão: cem nomes animados numa lista engasgam a rolagem", () => {
    const { style } = nameStyle({ style: { effect: "neon", color: ROSA } });

    expect(style?.["--gc-vel"]).toBeUndefined();
  });

  it("o cartão de perfil pede movimento explicitamente", () => {
    const { style } = nameStyle({ style: { effect: "neon", color: ROSA }, animate: true });

    expect(style?.["--gc-vel"]).toBeTruthy();
  });
});

describe("fonte", () => {
  it("`padrao` não vira nada", () => {
    expect(nameStyle({ style: { font: "padrao" } })).toEqual({
      className: undefined,
      style: undefined,
    });
  });

  it("fonte decorativa vira classe mais família, com queda pra fonte do app", () => {
    const { className, style } = nameStyle({ style: { font: "manuscrita" } });

    expect(className).toBe("gc-fonte");
    expect(String(style?.["--gc-fonte"])).toContain("Caveat");
  });
});

const role = (id: string, position: number, color: string | null) => ({
  id,
  guildId: "a".repeat(24),
  name: id,
  color,
  colorSecondary: null,
  iconUrl: null,
  iconEmoji: null,
  style: "solido" as const,
  position,
  permissions: [],
  hoist: false,
  mentionable: false,
  isEveryone: false,
});

describe("cor do cargo mais alto", () => {
  const roleList = [role("baixo", 1, BLUE), role("alto", 5, ROSA), role("sem-cor", 9, null)];

  it("pega o mais alto entre os que a pessoa tem", () => {
    expect(roleMoreHighColor(["baixo", "alto"], roleList)).toBe(ROSA);
  });

  it("cargo sem cor não pinta, e a busca continua no de baixo", () => {
    expect(roleMoreHighColor(["baixo", "sem-cor"], roleList)).toBe(BLUE);
  });

  it("sem cargo nenhum, sem cor", () => {
    expect(roleMoreHighColor([], roleList)).toBeNull();
  });
});

describe("estilo do cargo", () => {
  it("gradiente sem a segunda cor cai pra sólido em vez de sumir", () => {
    const { className, style } = roleStyle(
      { color: BLUE, colorSecondary: null, style: "gradiente" },
      { size: "md" },
    );

    expect(className).toBeUndefined();
    expect(style?.color).toBe(BLUE);
  });

  it("com as duas cores em tamanho grande, o gradiente vale", () => {
    const { className } = roleStyle(
      { color: BLUE, colorSecondary: ROSA, style: "gradiente" },
      { size: "md" },
    );

    expect(className).toBe("gc-cargo--gradiente");
  });

  it("holográfico vale em tamanho pequeno: anima a cor, não recorta o texto", () => {
    const { className } = roleStyle({
      color: BLUE,
      colorSecondary: ROSA,
      style: "holografico",
    });

    expect(className).toBe("gc-cargo--holografico");
  });
});
