import { describe, expect, it } from "vitest";

import {
  alternarPasta,
  desfazerPasta,
  editarPasta,
  montarTrilho,
  moverServidor,
  type Arrumacao,
} from "~/features/servidor/lib/trilho";

const g = (id: string) => ({ id });
const guilds = [g("a"), g("b"), g("c"), g("d")];
const ids = guilds.map((x) => x.id);
const vazia: Arrumacao = { ordem: [], pastas: [] };

describe("o trilho arrumado", () => {
  it("sem arrumação, é a lista como veio", () => {
    expect(montarTrilho(guilds, vazia).map((i) => i.tipo === "servidor" && i.guild.id)).toEqual(ids);
  });

  it("juntar dois servidores vira pasta no lugar do alvo", () => {
    const a = moverServidor(ids, vazia, "c", { tipo: "juntar", com: "a" });
    const itens = montarTrilho(guilds, a);

    expect(itens[0]!.tipo).toBe("pasta");
    expect(itens[0]!.tipo === "pasta" && itens[0]!.guilds.map((x) => x.id)).toEqual(["a", "c"]);
    expect(itens.slice(1).map((i) => i.tipo === "servidor" && i.guild.id)).toEqual(["b", "d"]);
  });

  it("antes e depois reordenam", () => {
    const a = moverServidor(ids, vazia, "d", { tipo: "antes", de: "a" });
    expect(montarTrilho(guilds, a).map((i) => i.tipo === "servidor" && i.guild.id)).toEqual(["d", "a", "b", "c"]);

    const b = moverServidor(ids, a, "a", { tipo: "depois", de: "c" });
    expect(montarTrilho(guilds, b).map((i) => i.tipo === "servidor" && i.guild.id)).toEqual(["d", "b", "c", "a"]);
  });

  it("pôr numa pasta e tirar dela", () => {
    let a = moverServidor(ids, vazia, "b", { tipo: "juntar", com: "a" });
    const pasta = a.pastas[0]!;
    a = moverServidor(ids, a, "c", { tipo: "pasta", pastaId: pasta.id });
    expect(a.pastas[0]!.guildIds).toEqual(["a", "b", "c"]);

    a = moverServidor(ids, a, "a", { tipo: "fim" });
    expect(a.pastas[0]!.guildIds).toEqual(["b", "c"]);
    expect(a.ordem.at(-1)).toBe("a");
  });

  it("pasta com um só servidor se desfaz sozinha", () => {
    let a = moverServidor(ids, vazia, "b", { tipo: "juntar", com: "a" });
    a = moverServidor(ids, a, "b", { tipo: "fim" });

    expect(a.pastas).toEqual([]);
    expect(montarTrilho(guilds, a).map((i) => i.tipo === "servidor" && i.guild.id)).toEqual(["a", "c", "d", "b"]);
  });

  it("desfazer a pasta devolve os servidores no lugar dela", () => {
    let a = moverServidor(ids, vazia, "c", { tipo: "juntar", com: "b" });
    a = desfazerPasta(a, a.pastas[0]!.id);

    expect(a.pastas).toEqual([]);
    expect(montarTrilho(guilds, a).map((i) => i.tipo === "servidor" && i.guild.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("servidor que saiu some; servidor novo entra no fim", () => {
    const a = moverServidor(ids, vazia, "c", { tipo: "juntar", com: "b" });
    const itens = montarTrilho([g("a"), g("c"), g("z")], a);

    expect(itens.map((i) => (i.tipo === "pasta" ? `pasta(${i.guilds.map((x) => x.id)})` : i.guild.id))).toEqual(["a", "pasta(c)", "z"]);
  });

  it("abrir, fechar e batizar", () => {
    let a = moverServidor(ids, vazia, "b", { tipo: "juntar", com: "a" });
    const id = a.pastas[0]!.id;

    expect(a.pastas[0]!.aberta).toBe(true);
    a = alternarPasta(a, id);
    expect(a.pastas[0]!.aberta).toBe(false);

    a = editarPasta(a, id, { nome: "Jogos", cor: "#ff0000" });
    expect(a.pastas[0]).toMatchObject({ nome: "Jogos", cor: "#ff0000" });
  });
});
