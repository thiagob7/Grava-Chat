import { BrowserWindow, ipcMain } from "electron";
import type { UpdateState } from "@gravae/shared";

import { createUpdater } from "./atualizacao.js";

export function registerUpdate(appWindow: () => BrowserWindow | null) {
  const notify = (state: UpdateState) => {
    const target = appWindow();
    if (target && !target.isDestroyed()) target.webContents.send("atualizacao:mudou", state);
  };

  const updater = createUpdater(notify);

  ipcMain.handle("atualizacao:estado", () => updater.state());
  ipcMain.handle("atualizacao:procurar", () => updater.lookup());
  ipcMain.handle("atualizacao:baixar", () => updater.download());
  ipcMain.handle("atualizacao:instalar", () => updater.install());

  updater.watch();

  return updater;
}
