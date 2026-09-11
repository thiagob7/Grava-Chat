import { ipcMain, shell, systemPreferences } from "electron";
import type { MediaKind } from "@gravae/shared";

const PANEL: Record<MediaKind, string> = {
  microphone: "Privacy_Microphone",
  camera: "Privacy_Camera",
  screen: "Privacy_ScreenCapture",
};

export function mediaRegisterPermissions() {
  const status = (kind: MediaKind) =>
    process.platform === "darwin" ? systemPreferences.getMediaAccessStatus(kind) : "granted";

  ipcMain.handle("midia:status", (_e, kind: MediaKind) => status(kind));

  ipcMain.handle("midia:garantir", async (_e, kind: MediaKind) => {
    if (process.platform !== "darwin") return true;
    if (status(kind) === "granted") return true;
    if (kind === "screen") return false;

    return systemPreferences.askForMediaAccess(kind);
  });

  ipcMain.handle("midia:abrir-ajustes", (_e, kind: MediaKind) => {
    if (process.platform !== "darwin") return;

    void shell.openExternal(
      `x-apple.systempreferences:com.apple.preference.security?${PANEL[kind]}`,
    );
  });
}
