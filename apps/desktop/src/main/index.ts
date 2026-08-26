import path from "node:path";
import { app, BrowserWindow, nativeImage } from "electron";

import { registrarAvisos } from "./avisos.js";
import { registrarCapturaDeTela } from "./captura-de-tela.js";
import { criarJanela } from "./janela.js";
import { registrarLoginDesktop } from "./login-desktop.js";
import { registrarPermissoesDeMidia } from "./permissoes.js";
import { registrarPushToTalk } from "./push-to-talk.js";

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let janela: BrowserWindow | null = null;
  const loginDesktop = registrarLoginDesktop();

  app.on("second-instance", (_evento, argv) => {
    const link = argv.find((arg) => arg.startsWith("gravae://"));
    if (link) loginDesktop.receberUrl(link);

    if (!janela) return;
    if (janela.isMinimized()) janela.restore();
    janela.focus();
  });

  const pushToTalk = registrarPushToTalk();

  app.on("will-quit", () => pushToTalk.encerrar());

  void app.whenReady().then(() => {
    if (process.platform === "darwin") {
      const icone = nativeImage.createFromPath(path.join(__dirname, "..", "build", "icon.png"));
      if (!icone.isEmpty()) app.dock?.setIcon(icone);
    }

    registrarPermissoesDeMidia();
    registrarCapturaDeTela();
    registrarAvisos();
    janela = criarJanela();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) janela = criarJanela();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
