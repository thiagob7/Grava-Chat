import { describe, expect, it } from "vitest";

import { computePermissions, has, highestPosition, type RoleLike } from "./permissions.js";

const EU = "6a8781da7415b08f427be1a4";
const OUTRO = "6a8781f57415b08f427be1ad";

const everyone: RoleLike = {
  id: "role-everyone",
  position: 0,
  permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "CONNECT"],
  isEveryone: true,
};

const design: RoleLike = {
  id: "role-design",
  position: 1,
  permissions: ["ATTACH_FILES"],
  isEveryone: false,
};

describe("no nível do servidor", () => {
  it("dono tem tudo, mesmo sem cargo nenhum", () => {
    const p = computePermissions({ userId: EU, isOwner: true, roles: [] });

    expect(has(p, "ADMINISTRATOR")).toBe(true);
    expect(has(p, "MANAGE_ROLES")).toBe(true);
  });

  it("soma as permissões de todos os cargos", () => {
    const p = computePermissions({ userId: EU, isOwner: false, roles: [everyone, design] });

    expect(has(p, "SEND_MESSAGES")).toBe(true); // do @everyone
    expect(has(p, "ATTACH_FILES")).toBe(true); // do Design
    expect(has(p, "MANAGE_ROLES")).toBe(false);
  });

  it("ADMINISTRATOR concede o resto por tabela", () => {
    const admin: RoleLike = { ...design, permissions: ["ADMINISTRATOR"] };
    const p = computePermissions({ userId: EU, isOwner: false, roles: [everyone, admin] });

    expect(has(p, "MANAGE_GUILD")).toBe(true);
    expect(has(p, "KICK_MEMBERS")).toBe(true);
  });

  it("permissão desconhecida no banco é ignorada em vez de virar acesso", () => {
    const estranho: RoleLike = { ...design, permissions: ["INVENTADA", "MANAGE_GUILD"] };
    const p = computePermissions({ userId: EU, isOwner: false, roles: [estranho] });

    expect(p.has("INVENTADA" as never)).toBe(false);
    expect(has(p, "MANAGE_GUILD")).toBe(true);
  });
});

describe("dentro de um canal", () => {
  it("negar no @everyone tira a permissão", () => {
    const p = computePermissions({
      userId: EU,
      isOwner: false,
      roles: [everyone],
      overwrites: [
        { targetId: everyone.id, type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] },
      ],
    });

    expect(has(p, "VIEW_CHANNEL")).toBe(false);
  });

  it("cargo permite de volta o que o @everyone negou", () => {
    const p = computePermissions({
      userId: EU,
      isOwner: false,
      roles: [everyone, design],
      overwrites: [
        { targetId: everyone.id, type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] },
        { targetId: design.id, type: "ROLE", allow: ["VIEW_CHANNEL"], deny: [] },
      ],
    });

    expect(has(p, "VIEW_CHANNEL")).toBe(true);
  });

  it("entre cargos, permitir vence negar (não depende da ordem do banco)", () => {
    const outroCargo: RoleLike = { id: "role-x", position: 2, permissions: [], isEveryone: false };

    const overwrites = [
      { targetId: design.id, type: "ROLE" as const, allow: [], deny: ["SEND_MESSAGES"] },
      { targetId: outroCargo.id, type: "ROLE" as const, allow: ["SEND_MESSAGES"], deny: [] },
    ];

    const roles = [everyone, design, outroCargo];
    const normal = computePermissions({ userId: EU, isOwner: false, roles, overwrites });
    const invertido = computePermissions({
      userId: EU,
      isOwner: false,
      roles,
      overwrites: [...overwrites].reverse(),
    });

    expect(has(normal, "SEND_MESSAGES")).toBe(true);
    expect(has(invertido, "SEND_MESSAGES")).toBe(true);
  });

  it("o overwrite da pessoa vence o do cargo", () => {
    const p = computePermissions({
      userId: EU,
      isOwner: false,
      roles: [everyone, design],
      overwrites: [
        { targetId: design.id, type: "ROLE", allow: ["SEND_MESSAGES"], deny: [] },
        { targetId: EU, type: "MEMBER", allow: [], deny: ["SEND_MESSAGES"] },
      ],
    });

    expect(has(p, "SEND_MESSAGES")).toBe(false);
  });

  it("overwrite de OUTRA pessoa não me afeta", () => {
    const p = computePermissions({
      userId: EU,
      isOwner: false,
      roles: [everyone],
      overwrites: [{ targetId: OUTRO, type: "MEMBER", allow: [], deny: ["VIEW_CHANNEL"] }],
    });

    expect(has(p, "VIEW_CHANNEL")).toBe(true);
  });

  it("overwrite de cargo que eu NÃO tenho é ignorado", () => {
    const p = computePermissions({
      userId: EU,
      isOwner: false,
      roles: [everyone],
      overwrites: [{ targetId: "role-que-nao-tenho", type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] }],
    });

    expect(has(p, "VIEW_CHANNEL")).toBe(true);
  });

  it("ADMINISTRATOR ignora restrição de canal — ninguém se tranca fora", () => {
    const admin: RoleLike = { ...design, permissions: ["ADMINISTRATOR"] };
    const p = computePermissions({
      userId: EU,
      isOwner: false,
      roles: [everyone, admin],
      overwrites: [{ targetId: everyone.id, type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] }],
    });

    expect(has(p, "VIEW_CHANNEL")).toBe(true);
  });

  it("dono ignora restrição de canal", () => {
    const p = computePermissions({
      userId: EU,
      isOwner: true,
      roles: [everyone],
      overwrites: [{ targetId: everyone.id, type: "ROLE", allow: [], deny: ["VIEW_CHANNEL"] }],
    });

    expect(has(p, "VIEW_CHANNEL")).toBe(true);
  });
});

describe("hierarquia", () => {
  it("devolve a posição do cargo mais alto", () => {
    expect(highestPosition([everyone, design])).toBe(1);
  });

  it("sem cargo nenhum fica abaixo do @everyone", () => {
    expect(highestPosition([])).toBe(-1);
  });
});
