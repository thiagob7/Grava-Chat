import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import type { LoginCode } from "@gravae/shared";

import { APP_URL } from "./config.js";

const SCHEMA = "gravae";

export function registerLoginDesktop() {
  let verifier: string | null = null;
  let pending: LoginCode | null = null;

  if (process.defaultApp && process.argv[1]) {
    app.setAsDefaultProtocolClient(SCHEMA, process.execPath, [path.resolve(process.argv[1])]);
  } else {
    app.setAsDefaultProtocolClient(SCHEMA);
  }

  const deliver = (data: LoginCode) => {
    const appWindow = BrowserWindow.getAllWindows()[0];

    if (!appWindow || appWindow.webContents.isLoading()) {
      pending = data;
      return;
    }

    appWindow.show();
    appWindow.focus();
    appWindow.webContents.send("login:codigo", data);
  };

  const receiveUrl = (url: string) => {
    if (!url.startsWith(`${SCHEMA}://`)) return;

    const code = new URL(url).searchParams.get("codigo");
    if (!code || !verifier) return;

    deliver({ code, verifier });
    verifier = null;
  };

  app.on("open-url", (event, url) => {
    event.preventDefault();
    receiveUrl(url);
  });

  ipcMain.handle("login:iniciar", () => {
    verifier = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");

    void shell.openExternal(
      `${APP_URL}/api/auth/desktop/start?desafio=${encodeURIComponent(challenge)}`,
    );
  });

  ipcMain.handle("login:pendente", () => {
    const data = pending;
    pending = null;
    return data;
  });

  return { receiveUrl };
}
