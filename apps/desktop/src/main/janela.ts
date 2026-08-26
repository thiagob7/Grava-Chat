import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, ehDev } from "./config.js";

async function carregarComEspera(janela: BrowserWindow, tentativas = 40) {
  for (let i = 0; i < tentativas; i++) {
    try {
      await janela.loadURL(APP_URL);
      return;
    } catch {
      if (janela.isDestroyed()) return;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  await janela.loadURL(
    `data:text/html,${encodeURIComponent(
      `<body style="background:#2b2d31;color:#f2f3f5;font:15px -apple-system,sans-serif;display:grid;place-items:center;height:100vh;margin:0">
         <div style="text-align:center">
           <p>Não consegui falar com o Gravaê em <b>${APP_URL}</b>.</p>
           <p style="color:#b5bac1">Ele está rodando? (<code>yarn dev</code>)</p>
         </div>
       </body>`,
    )}`,
  );
}

const ICONE = path.join(__dirname, "..", "build", "icon.png");

export function criarJanela() {
  const janela = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 560,
    backgroundColor: "#2b2d31",
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...(process.platform === "darwin" ? {} : { icon: ICONE }),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--gravae-nome=${ehDev ? "Electron" : app.name}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  janela.once("ready-to-show", () => janela.show());

  janela.webContents.on("did-finish-load", () => console.log(`[desktop] carregou ${APP_URL}`));

  if (ehDev) {
    janela.webContents.on("console-message", (evento) => {
      if (evento.level === "info" || evento.level === "debug") return;
      console.log(`[front:${evento.level}] ${evento.message}`);
    });
  }
  janela.webContents.on("did-fail-load", (_e, code, descricao) =>
    console.error(`[desktop] falhou ao carregar ${APP_URL}: ${descricao} (${code})`),
  );

  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) void shell.openExternal(url);
    return { action: "deny" };
  });

  janela.webContents.on("will-navigate", (evento, url) => {
    if (new URL(url).origin === APP_ORIGIN) return;
    evento.preventDefault();
    void shell.openExternal(url);
  });

  janela.webContents.session.setPermissionRequestHandler((_wc, permissao, permitir) => {
    permitir(["media", "display-capture", "clipboard-read", "notifications"].includes(permissao));
  });

  void carregarComEspera(janela);

  if (ehDev && !app.isPackaged) janela.webContents.openDevTools({ mode: "detach" });

  return janela;
}
