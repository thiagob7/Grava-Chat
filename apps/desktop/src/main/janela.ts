import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, ehDev } from "./config.js";

async function carregarComEspera(janela: BrowserWindow, tentativas = 40) {
  /*
    O app é uma janela carregando o site, então atualizar o site atualiza o app
    — mas só se ele não servir a versão velha do próprio cache. Foi o que
    aconteceu: publicamos, e a janela continuou mostrando o build anterior.

    Limpar o cache HTTP na abertura resolve de vez. Custa alguns megabytes
    baixados de novo a cada início, o que é nada perto de alguém jurando que a
    correção não subiu.
  */
  await janela.webContents.session.clearCache().catch(() => undefined);

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

  /*
    A janela acompanha o fullscreen da PÁGINA.

    No macOS com `titleBarStyle: "hiddenInset"`, o Electron nem sempre
    redimensiona a janela quando o conteúdo pede tela cheia: o documento entra
    em fullscreen, a janela fica do mesmo tamanho, e pra quem clicou o botão
    simplesmente não fez nada. Ligar os dois eventos resolve — e o Esc, que o
    navegador trata sozinho, dispara o `leave` e devolve a janela.
  */
  janela.webContents.on("enter-html-full-screen", () => janela.setFullScreen(true));
  janela.webContents.on("leave-html-full-screen", () => janela.setFullScreen(false));

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
