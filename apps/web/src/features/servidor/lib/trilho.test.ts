import { describe, expect, it } from "vitest";

import {
  toggleFolder,
  undoFolder,
  editFolder,
  buildRail,
  moveServer,
  type Layout,
} from "~/features/servidor/lib/trilho";

const g = (id: string) => ({ id });
const guilds = [g("a"), g("b"), g("c"), g("d")];
const ids = guilds.map((x) => x.id);
const empty: Layout = { order: [], folders: [] };

describe("o trilho arrumado", () => {
  it("sem arrumação, é a lista como veio", () => {
    expect(buildRail(guilds, empty).map((i) => i.kind === "servidor" && i.guild.id)).toEqual(ids);
  });

  it("juntar dois servidores vira pasta no lugar do alvo", () => {
    const a = moveServer(ids, empty, "c", { kind: "juntar", having: "a" });
    const items = buildRail(guilds, a);

    expect(items[0]!.kind).toBe("pasta");
    expect(items[0]!.kind === "pasta" && items[0]!.guilds.map((x) => x.id)).toEqual(["a", "c"]);
    expect(items.slice(1).map((i) => i.kind === "servidor" && i.guild.id)).toEqual(["b", "d"]);
  });

  it("antes e depois reordenam", () => {
    const a = moveServer(ids, empty, "d", { kind: "antes", de: "a" });
    expect(buildRail(guilds, a).map((i) => i.kind === "servidor" && i.guild.id)).toEqual(["d", "a", "b", "c"]);

    const b = moveServer(ids, a, "a", { kind: "depois", de: "c" });
    expect(buildRail(guilds, b).map((i) => i.kind === "servidor" && i.guild.id)).toEqual(["d", "b", "c", "a"]);
  });

  it("pôr numa pasta e tirar dela", () => {
    let a = moveServer(ids, empty, "b", { kind: "juntar", having: "a" });
    const folder = a.folders[0]!;
    a = moveServer(ids, a, "c", { kind: "pasta", folderId: folder.id });
    expect(a.folders[0]!.guildIds).toEqual(["a", "b", "c"]);

    a = moveServer(ids, a, "a", { kind: "fim" });
    expect(a.folders[0]!.guildIds).toEqual(["b", "c"]);
    expect(a.order.at(-1)).toBe("a");
  });

  it("pasta com um só servidor se desfaz sozinha", () => {
    let a = moveServer(ids, empty, "b", { kind: "juntar", having: "a" });
    a = moveServer(ids, a, "b", { kind: "fim" });

    expect(a.folders).toEqual([]);
    expect(buildRail(guilds, a).map((i) => i.kind === "servidor" && i.guild.id)).toEqual(["a", "c", "d", "b"]);
  });

  it("desfazer a pasta devolve os servidores no lugar dela", () => {
    let a = moveServer(ids, empty, "c", { kind: "juntar", having: "b" });
    a = undoFolder(a, a.folders[0]!.id);

    expect(a.folders).toEqual([]);
    expect(buildRail(guilds, a).map((i) => i.kind === "servidor" && i.guild.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("servidor que saiu some; servidor novo entra no fim", () => {
    const a = moveServer(ids, empty, "c", { kind: "juntar", having: "b" });
    const items = buildRail([g("a"), g("c"), g("z")], a);

    expect(items.map((i) => (i.kind === "pasta" ? `pasta(${i.guilds.map((x) => x.id)})` : i.guild.id))).toEqual(["a", "pasta(c)", "z"]);
  });

  it("abrir, fechar e batizar", () => {
    let a = moveServer(ids, empty, "b", { kind: "juntar", having: "a" });
    const id = a.folders[0]!.id;

    expect(a.folders[0]!.isOpen).toBe(true);
    a = toggleFolder(a, id);
    expect(a.folders[0]!.isOpen).toBe(false);

    a = editFolder(a, id, { name: "Jogos", color: "#ff0000" });
    expect(a.folders[0]).toMatchObject({ name: "Jogos", color: "#ff0000" });
  });
});
