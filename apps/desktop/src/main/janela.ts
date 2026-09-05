import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, ehDev } from "./config.js";

const MARCA = `<svg width="54" height="80" viewBox="0 0 538 802" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 657.14L358.358 614.064V610.397L402.349 249.29L228.212 284.118L208.965 391.352L283.203 378.519L269.455 485.753L151.225 499.499L198.883 132.895L432.595 116.398L443.592 0L89.8185 44.9095L0 657.14Z" fill="white"/><path d="M461.458 801.261C503.731 801.261 538 766.992 538 724.72C538 682.447 503.731 648.178 461.458 648.178C419.185 648.178 384.916 682.447 384.916 724.72C384.916 766.992 419.185 801.261 461.458 801.261Z" fill="#FF0000"/></svg>`;

function paginaDeEspera(motivo: string) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    `<!doctype html><meta charset="utf-8">
     <body style="background:#121214;color:#e1e1e6;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;place-items:center;height:100vh;margin:0;-webkit-user-select:none">
       <div style="text-align:center;max-width:22rem;padding:0 24px">
         <div style="animation:respirar 2s ease-in-out infinite">${MARCA}</div>
         <h1 style="margin:28px 0 8px;font-size:17px;font-weight:600">${motivo}</h1>
         <p style="margin:0;color:#a8a8b3">Isto volta sozinho assim que a conexão voltar — não precisa fechar o app.</p>
         <a href="${APP_URL}" style="display:inline-block;margin-top:22px;padding:9px 18px;border-radius:8px;background:#d30404;color:#fff;text-decoration:none;font-weight:600">Tentar agora</a>
       </div>
       <style>@keyframes respirar{0%,100%{opacity:1}50%{opacity:.45}}</style>
     </body>`,
  )}`;
}

function criarCarregador(janela: BrowserWindow) {
  let tentativas = 0;
  let relogio: NodeJS.Timeout | null = null;

  const carregar = async () => {
    if (janela.isDestroyed()) return;

    try {
      await janela.loadURL(APP_URL);
      tentativas = 0;
    } catch {
      /// O `did-fail-load` cuida de mostrar a espera e reagendar; aqui só não
      /// deixamos a promessa rejeitada subir sem dono.
    }
  };

  const agendar = () => {
    if (relogio) clearTimeout(relogio);

    tentativas += 1;
    const espera = Math.min(500 * 2 ** Math.min(tentativas, 5), 10_000);
    relogio = setTimeout(() => void carregar(), espera);
  };

  const encerrar = () => {
    if (relogio) clearTimeout(relogio);
    relogio = null;
  };

  return { carregar, agendar, encerrar };
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

  janela.webContents.on("enter-html-full-screen", () => janela.setFullScreen(true));
  janela.webContents.on("leave-html-full-screen", () => janela.setFullScreen(false));

  janela.webContents.on("did-finish-load", () => console.log(`[desktop] carregou ${APP_URL}`));

  if (ehDev) {
    janela.webContents.on("console-message", (evento) => {
      if (evento.level === "info" || evento.level === "debug") return;
      console.log(`[front:${evento.level}] ${evento.message}`);
    });
  }
  const carregador = criarCarregador(janela);

  janela.webContents.on("did-fail-load", (_e, code, descricao, urlQueFalhou, ehPrincipal) => {
    console.error(`[desktop] falhou ao carregar ${urlQueFalhou}: ${descricao} (${code})`);

    if (!ehPrincipal || code === -3 || janela.isDestroyed()) return;

    void janela.loadURL(paginaDeEspera("Sem conexão com o Gravaê"));
    carregador.agendar();
  });

  janela.on("closed", () => carregador.encerrar());

  /*
    Link de fora vai para o navegador. Mas uma janela nossa — o estúdio de
    temas, que precisa ficar ao lado do app para a pessoa ver o tema mudando —
    abre aqui dentro, com a mesma casca e o mesmo preload.
  */
  janela.webContents.setWindowOpenHandler(({ url }) => {
    const nossa = (() => {
      try {
        return new URL(url).origin === APP_ORIGIN;
      } catch {
        return false;
      }
    })();

    if (!nossa) {
      if (url.startsWith("http")) void shell.openExternal(url);
      return { action: "deny" };
    }

    return {
      action: "allow",
      overrideBrowserWindowOptions: {
        width: 1280,
        height: 860,
        minWidth: 820,
        minHeight: 520,
        backgroundColor: "#2b2d31",
        titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
        ...(process.platform === "darwin" ? {} : { icon: ICONE }),
        webPreferences: {
          preload: path.join(__dirname, "preload.cjs"),
          additionalArguments: [`--gravae-nome=${ehDev ? "Electron" : app.name}`],
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
        },
      },
    };
  });

  janela.webContents.on("will-navigate", (evento, url) => {
    if (new URL(url).origin === APP_ORIGIN) return;
    evento.preventDefault();
    void shell.openExternal(url);
  });

  janela.webContents.session.setPermissionRequestHandler((quem, permissao, permitir, detalhes) => {
    const origem = (() => {
      try {
        return new URL(detalhes?.requestingUrl || quem?.getURL() || "").origin;
      } catch {
        return null;
      }
    })();

    const nossa = origem === APP_ORIGIN;
    if (!nossa) {
      console.warn(`[desktop] permissão "${permissao}" negada para ${origem ?? "origem desconhecida"}`);
    }

    permitir(nossa);
  });

  void janela.loadURL(paginaDeEspera("Abrindo o Gravaê…")).then(async () => {
    await janela.webContents.session.clearCache().catch(() => undefined);
    await carregador.carregar();
  });

  if (ehDev && !app.isPackaged) janela.webContents.openDevTools({ mode: "detach" });

  return janela;
}
