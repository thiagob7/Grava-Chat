import path from "node:path";
import { app, BrowserWindow, nativeImage } from "electron";

import { registrarCapturaDeTela } from "./captura-de-tela.js";
import { criarJanela } from "./janela.js";
import { registrarLoginDesktop } from "./login-desktop.js";
import { registrarPermissoesDeMidia } from "./permissoes.js";
import { registrarPushToTalk } from "./push-to-talk.js";

/**
 * Uma instância só. Duas janelas do Gravaê ao mesmo tempo significariam duas
 * conexões de voz da mesma pessoa na mesma sala — e, na Fase 5, o deep link do
 * login chegaria na cópia errada.
 */
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  let janela: BrowserWindow | null = null;
  const loginDesktop = registrarLoginDesktop();

  /**
   * No Windows e no Linux o `gravae://` chega como argumento de uma segunda
   * instância — que o bloqueio acima encerra. É aqui que o link é resgatado
   * antes de a cópia extra morrer.
   */
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
    // em desenvolvimento a doca mostraria o átomo do Electron
    if (process.platform === "darwin") {
      const icone = nativeImage.createFromPath(path.join(__dirname, "..", "build", "icon.png"));
      if (!icone.isEmpty()) app.dock?.setIcon(icone);
    }

    registrarPermissoesDeMidia();
    registrarCapturaDeTela();
    janela = criarJanela();

    // no macOS, clicar no ícone da doca com o app aberto e sem janela reabre
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) janela = criarJanela();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
