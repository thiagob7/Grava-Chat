import { describe, expect, it, vi } from "vitest";

import type { BridgeDesktop } from "@gravae/shared";

import { comNomesNovos } from "~/lib/ponte-mais-velha";

const oldBridge = (overrides: Record<string, unknown> = {}) =>
  ({
    ehDesktop: true,
    plataforma: "darwin",
    nomeNoSistema: "Gravaê",
    ptt: { configurar: vi.fn(), pedirPermissao: vi.fn(), aoMudar: vi.fn() },
    tela: { aoPedirEscolha: vi.fn(), responder: vi.fn(), permissao: vi.fn() },
    login: { iniciar: vi.fn(), aoReceber: vi.fn() },
    midia: { status: vi.fn(), garantir: vi.fn(), abrirAjustes: vi.fn() },
    janela: { contador: vi.fn(), chamarAtencao: vi.fn(), focar: vi.fn() },
    ...overrides,
  }) as unknown as BridgeDesktop;

describe("ponte de uma casca mais velha", () => {
  it("dá ao site os nomes que ele pede", () => {
    const bridge = comNomesNovos(oldBridge());

    expect(bridge?.isDesktop).toBe(true);
    expect(bridge?.platform).toBe("darwin");
    expect(bridge?.nameSystem).toBe("Gravaê");
    expect(typeof bridge?.login.onReceive).toBe("function");
    expect(typeof bridge?.media.ensure).toBe("function");
    expect(typeof bridge?.appWindow.focus).toBe("function");
  });

  it("traduz o código de login que a casca entrega", () => {
    const aoReceber = vi.fn();
    const bridge = comNomesNovos(
      oldBridge({ login: { iniciar: vi.fn(), aoReceber } }),
    );

    const seen = vi.fn();
    bridge?.login.onReceive(seen);

    const callback = aoReceber.mock.calls[0]![0] as (data: unknown) => void;
    callback({ codigo: "abc", verificador: "xyz" });

    expect(seen).toHaveBeenCalledWith({ code: "abc", verifier: "xyz" });
  });

  it("traduz o estado do push-to-talk nos dois sentidos", async () => {
    const configurar = vi
      .fn()
      .mockResolvedValue({ ativo: true, indisponivel: false, precisaPermissao: false });

    const bridge = comNomesNovos(
      oldBridge({ ptt: { configurar, pedirPermissao: vi.fn(), aoMudar: vi.fn() } }),
    );

    await expect(bridge?.ptt.configure({ active: true, key: "F8" })).resolves.toEqual({
      active: true,
      unavailable: false,
      needsPermission: false,
    });

    expect(configurar).toHaveBeenCalledWith({ ativo: true, tecla: "F8" });
  });

  it("traduz as fontes de tela e a escolha", () => {
    const aoPedirEscolha = vi.fn();
    const responder = vi.fn();
    const bridge = comNomesNovos(
      oldBridge({ tela: { aoPedirEscolha, responder, permissao: vi.fn() } }),
    );

    const seen = vi.fn();
    bridge?.display.onRequestChoice(seen);

    const callback = aoPedirEscolha.mock.calls[0]![0] as (fonts: unknown[]) => void;
    callback([{ id: "screen:1", nome: "Tela 1", ehTela: true, miniatura: null, icone: null }]);

    expect(seen).toHaveBeenCalledWith([
      { id: "screen:1", name: "Tela 1", isScreen: true, thumbnail: null, icon: null },
    ]);

    bridge?.display.reply({ id: "screen:1", withAudio: true });
    expect(responder).toHaveBeenCalledWith({ id: "screen:1", comAudio: true });
  });

  it("deixa de fora o que a casca velha não tem", () => {
    const bridge = comNomesNovos(oldBridge());

    expect(bridge?.links).toBeUndefined();
    expect(bridge?.update).toBeUndefined();
    expect(bridge?.system).toBeUndefined();
    expect(bridge?.versions).toBeUndefined();
  });

  it("não mexe numa casca que já fala inglês", () => {
    const fresh = { isDesktop: true, platform: "win32" } as unknown as BridgeDesktop;

    expect(comNomesNovos(fresh)).toBe(fresh);
  });
});
