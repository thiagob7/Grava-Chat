import { ipcMain, shell, systemPreferences } from "electron";
import type { TipoDeMidia } from "@gravae/shared";

const PAINEL: Record<TipoDeMidia, string> = {
  microphone: "Privacy_Microphone",
  camera: "Privacy_Camera",
  screen: "Privacy_ScreenCapture",
};

export function registrarPermissoesDeMidia() {
  const status = (tipo: TipoDeMidia) =>
    process.platform === "darwin" ? systemPreferences.getMediaAccessStatus(tipo) : "granted";

  ipcMain.handle("midia:status", (_e, tipo: TipoDeMidia) => status(tipo));

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
