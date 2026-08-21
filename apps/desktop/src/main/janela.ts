import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, ehDev } from "./config.js";

/**
 * O Vite pode ainda não estar de pé quando o Electron abre (o `yarn dev` sobe
 * os dois em paralelo). Em vez de mostrar a tela de erro do Chromium, tenta de
 * novo por alguns segundos.
 */
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

/**
 * O ícone do Gravaê. No macOS empacotado quem manda é o `.icns` do bundle, mas
 * em desenvolvimento a doca mostraria o átomo do Electron — então aqui a gente
 * troca na mão. No Windows e no Linux é o ícone da própria janela.
 */
const ICONE = path.join(__dirname, "..", "build", "icon.png");

export function criarJanela() {
  const janela = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 560,
    // a mesma cor de fundo do app: sem isto, cada abertura pisca branco
    backgroundColor: "#2b2d31",
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...(process.platform === "darwin" ? {} : { icon: ICONE }),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      /**
       * O preload roda em outro processo e não enxerga o `app`. Em
       * desenvolvimento quem executa é o Electron cru, e é com o nome DELE que
       * o macOS lista o app nas permissões — mandar a pessoa procurar "Gravaê"
       * numa lista onde só existe "Electron" é perder a viagem.
       */
      additionalArguments: [`--gravae-nome=${ehDev ? "Electron" : app.name}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  janela.once("ready-to-show", () => janela.show());

  janela.webContents.on("did-finish-load", () => console.log(`[desktop] carregou ${APP_URL}`));

  /**
   * Em desenvolvimento, o console do front sai no MESMO terminal do `yarn
   * desktop`. Sem isto, um erro do renderer só existe dentro das devtools — e
   * quem está lendo o log do processo principal não faz ideia de que algo
   * quebrou do outro lado.
   */
  if (ehDev) {
    janela.webContents.on("console-message", (evento) => {
      if (evento.level === "info" || evento.level === "debug") return;
      console.log(`[front:${evento.level}] ${evento.message}`);
    });
  }
  janela.webContents.on("did-fail-load", (_e, code, descricao) =>
    console.error(`[desktop] falhou ao carregar ${APP_URL}: ${descricao} (${code})`),
  );

  /**
   * Link pra fora abre no navegador do sistema. Sem isto, clicar num link do
   * chat sequestra a janela do app — e não há como voltar, porque o app não
   * tem barra de endereço.
   */
  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) void shell.openExternal(url);
    return { action: "deny" };
  });

  janela.webContents.on("will-navigate", (evento, url) => {
    if (new URL(url).origin === APP_ORIGIN) return;
    evento.preventDefault();
    void shell.openExternal(url);
  });

  /**
   * Microfone, câmera e captura de tela: o app é nosso, a pergunta já foi feita
   * na interface. O sistema operacional ainda pede a permissão dele por cima
   * disso — o que some é só o segundo pedido, redundante, do Chromium.
   */
  janela.webContents.session.setPermissionRequestHandler((_wc, permissao, permitir) => {
    permitir(["media", "display-capture", "clipboard-read", "notifications"].includes(permissao));
  });

  void carregarComEspera(janela);

  // devtools só quando se está DESENVOLVENDO — o app empacotado aponta pro
  // mesmo localhost enquanto não há Fase 6, e abrir devtools nele é ruído
  if (ehDev && !app.isPackaged) janela.webContents.openDevTools({ mode: "detach" });

  return janela;
}
