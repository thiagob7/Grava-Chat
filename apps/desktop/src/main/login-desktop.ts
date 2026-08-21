import { createHash, randomBytes } from "node:crypto";
import path from "node:path";
import { app, BrowserWindow, ipcMain, shell } from "electron";
import type { CodigoDeLogin } from "@gravae/shared";

import { APP_URL } from "./config.js";

/**
 * Login com Google no aplicativo.
 *
 * O consentimento acontece no navegador do sistema — o Google recusa janela
 * embutida, e é o certo a fazer: numa janela do próprio app ninguém consegue
 * conferir que a senha está indo mesmo pro Google. O retorno vem por
 * `gravae://auth?codigo=...`.
 *
 * O verificador nunca sai daqui: só o sha256 dele vai no link que abre o
 * navegador. Assim, um programa qualquer que se registre no mesmo `gravae://`
 * até intercepta o código, mas não consegue trocá-lo por sessão nenhuma.
 */

const ESQUEMA = "gravae";

export function registrarLoginDesktop() {
  let verificador: string | null = null;
  /** Chegou antes de a janela existir (o link ABRIU o app). */
  let pendente: CodigoDeLogin | null = null;

  /**
   * Em desenvolvimento o executável é o Electron, não o Gravaê: sem apontar o
   * caminho do projeto, o sistema registraria o esquema pro Electron cru e o
   * link abriria um app vazio.
   */
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

  // macOS entrega o link por evento; Windows e Linux, como argumento de uma
  // segunda instância (ver o `second-instance` em index.ts).
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

  /** O front pergunta ao se inscrever: cobre o caso de o link ter aberto o app. */
  ipcMain.handle("login:pendente", () => {
    const dados = pendente;
    pendente = null;
    return dados;
  });

  return { receberUrl };
}
