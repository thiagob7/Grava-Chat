import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import type { CodigoDeLogin } from "@gravae/shared";

import { APP_URL } from "./config.js";

const ESQUEMA = "gravae";

export function registrarLoginDesktop() {
  let verificador: string | null = null;
  let pendente: CodigoDeLogin | null = null;

  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(ESQUEMA, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(ESQUEMA);
  }

  const entregar = (dados: CodigoDeLogin) => {
    const janela = BrowserWindow.getAllWindows()[0];

    if (!janela || janela.webContents.isLoading()) {
      pendente = dados;
      return;
    }

    janela.show();
    janela.focus();
    janela.webContents.send("login:codigo", dados);
  };

  const receberUrl = (url: string) => {
    if (!url.startsWith(`${ESQUEMA}://`)) return;

    const codigo = new URL(url).searchParams.get("codigo");
    if (!codigo || !verificador) return;

    entregar({ codigo, verificador });
    verificador = null;
  };

  app.on("open-url", (evento, url) => {
    evento.preventDefault();
    receberUrl(url);
  });

  ipcMain.handle("login:iniciar", () => {
    verificador = randomBytes(32).toString("base64url");
    const desafio = createHash("sha256").update(verificador).digest("base64url");

    void shell.openExternal(
      `${APP_URL}/api/auth/desktop/start?desafio=${encodeURIComponent(desafio)}`,
    );
  });

  ipcMain.handle("login:pendente", () => {
    const dados = pendente;
    pendente = null;
    return dados;
  });

  return { receberUrl };
}
