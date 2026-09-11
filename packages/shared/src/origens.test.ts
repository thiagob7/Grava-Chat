import { describe, expect, it } from "vitest";

import { houseAddress, APP_ORIGINS } from "./origens.js";

const HERE = "http://localhost:5173";

describe("endereço da casa", () => {
  it("aceita a origem de quem está lendo", () => {
    expect(houseAddress(`${HERE}/invite/abcd1234`, HERE)?.pathname).toBe(
      "/invite/abcd1234",
    );
  });

  it("resolve o link relativo contra a primeira origem", () => {
    expect(houseAddress("/invite/abcd1234", [HERE, ...APP_ORIGINS])?.origin).toBe(
      HERE,
    );
  });

  it("aceita o link copiado de outro ambiente nosso", () => {
    const link = "https://gravae-chat.vercel.app/invite/ASan_PxE";

    expect(houseAddress(link, HERE)).toBeNull();
    expect(houseAddress(link, [HERE, ...APP_ORIGINS])?.pathname).toBe(
      "/invite/ASan_PxE",
    );
  });

  it("recusa link de fora", () => {
    expect(houseAddress("https://discord.gg/abcd", [HERE, ...APP_ORIGINS])).toBeNull();
    expect(
      houseAddress("https://gravae-chat.vercel.app.site-de-outro.com/invite/abcd1234", [
        HERE,
        ...APP_ORIGINS,
      ]),
    ).toBeNull();
  });

  it("trata lixo como caminho relativo nosso, e quem filtra é o caminho", () => {
    expect(houseAddress("nem url isso é", HERE)?.origin).toBe(HERE);
  });

  it("devolve nulo sem nenhuma origem para comparar", () => {
    expect(houseAddress(`${HERE}/invite/abcd1234`, [])).toBeNull();
  });
});
