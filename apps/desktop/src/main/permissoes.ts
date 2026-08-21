import { ipcMain, shell, systemPreferences } from "electron";
import type { TipoDeMidia } from "@gravae/shared";

/**
 * Permissão de mídia do SISTEMA — que no macOS é outra coisa, e vem antes, da
 * permissão do Chromium.
 *
 * Sem isto o `getUserMedia` falha calado: a interface dizia "libere o acesso
 * nas permissões do navegador" e não havia navegador nenhum pra liberar. O que
 * faltava era o Gravaê na lista de Microfone dos Ajustes do Sistema.
 */

/** O painel exato de cada permissão. Levar pra tela geral não ajuda ninguém. */
const PAINEL: Record<TipoDeMidia, string> = {
  microphone: "Privacy_Microphone",
  camera: "Privacy_Camera",
  screen: "Privacy_ScreenCapture",
};

export function registrarPermissoesDeMidia() {
  const status = (tipo: TipoDeMidia) =>
    process.platform === "darwin" ? systemPreferences.getMediaAccessStatus(tipo) : "granted";

  ipcMain.handle("midia:status", (_e, tipo: TipoDeMidia) => status(tipo));

  /**
   * Pede a permissão e diz se dá pra seguir.
   *
   * `askForMediaAccess` só mostra o pedido do sistema na PRIMEIRA vez
   * ("not-determined"). Depois de um "não permitir" ele devolve `false` na
   * hora, sem tela nenhuma — daí o caminho passar a ser o botão que abre os
   * ajustes. E "screen" não tem pedido: o macOS só mostra o dele na primeira
   * captura de verdade.
   */
  ipcMain.handle("midia:garantir", async (_e, tipo: TipoDeMidia) => {
    if (process.platform !== "darwin") return true;
    if (status(tipo) === "granted") return true;
    if (tipo === "screen") return false;

    return systemPreferences.askForMediaAccess(tipo);
  });

  ipcMain.handle("midia:abrir-ajustes", (_e, tipo: TipoDeMidia) => {
    if (process.platform !== "darwin") return;

    void shell.openExternal(
      `x-apple.systempreferences:com.apple.preference.security?${PAINEL[tipo]}`,
    );
  });
}
