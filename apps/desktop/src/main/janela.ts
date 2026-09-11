import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, isDev } from "./config.js";

const BRAND = `<svg width="54" height="80" viewBox="0 0 538 802" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 657.14L358.358 614.064V610.397L402.349 249.29L228.212 284.118L208.965 391.352L283.203 378.519L269.455 485.753L151.225 499.499L198.883 132.895L432.595 116.398L443.592 0L89.8185 44.9095L0 657.14Z" fill="white"/><path d="M461.458 801.261C503.731 801.261 538 766.992 538 724.72C538 682.447 503.731 648.178 461.458 648.178C419.185 648.178 384.916 682.447 384.916 724.72C384.916 766.992 419.185 801.261 461.458 801.261Z" fill="#FF0000"/></svg>`;

function waitPage(reason: string) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    `<!doctype html><meta charset="utf-8">
     <body style="background:#121214;color:#e1e1e6;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;place-items:center;height:100vh;margin:0;-webkit-user-select:none">
       <div style="text-align:center;max-width:22rem;padding:0 24px">
         <div style="animation:respirar 2s ease-in-out infinite">${BRAND}</div>
         <h1 style="margin:28px 0 8px;font-size:17px;font-weight:600">${reason}</h1>
         <p style="margin:0;color:#a8a8b3">Isto volta sozinho assim que a conexão voltar — não precisa fechar o app.</p>
         <a href="${APP_URL}" style="display:inline-block;margin-top:22px;padding:9px 18px;border-radius:8px;background:#d30404;color:#fff;text-decoration:none;font-weight:600">Tentar agora</a>
       </div>
       <style>@keyframes respirar{0%,100%{opacity:1}50%{opacity:.45}}</style>
     </body>`,
  )}`;
}

function createLoader(appWindow: BrowserWindow) {
  let attempts = 0;
  let clock: NodeJS.Timeout | null = null;

  const load = async () => {
    if (appWindow.isDestroyed()) return;

    try {
      await appWindow.loadURL(APP_URL);
      attempts = 0;
    } catch {
    }
  };

  const schedule = () => {
    if (clock) clearTimeout(clock);

    attempts += 1;
    const wait = Math.min(500 * 2 ** Math.min(attempts, 5), 10_000);
    clock = setTimeout(() => void load(), wait);
  };

  const end = () => {
    if (clock) clearTimeout(clock);
    clock = null;
  };

  return { load, schedule, end };
}

const ICON = path.join(__dirname, "..", "build", "icon.png");

export function createWindow() {
  const appWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 560,
    backgroundColor: "#2b2d31",
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...(process.platform === "darwin" ? {} : { frame: false, icon: ICON }),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--gravae-nome=${isDev ? "Electron" : app.name}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  appWindow.once("ready-to-show", () => appWindow.show());

  const notifyMaximized = () =>
    appWindow.webContents.send("janela:maximizada", appWindow.isMaximized());

  appWindow.on("maximize", notifyMaximized);
  appWindow.on("unmaximize", notifyMaximized);

  appWindow.webContents.on("enter-html-full-screen", () => appWindow.setFullScreen(true));
  appWindow.webContents.on("leave-html-full-screen", () => appWindow.setFullScreen(false));

  appWindow.webContents.on("did-finish-load", () => console.log(`[desktop] carregou ${APP_URL}`));

  if (isDev) {
    appWindow.webContents.on("console-message", (event) => {
      if (event.level === "info" || event.level === "debug") return;
      console.log(`[front:${event.level}] ${event.message}`);
    });
  }
  const loader = createLoader(appWindow);

  appWindow.webContents.on("did-fail-load", (_e, code, description, urlFailed, isPrincipal) => {
    console.error(`[desktop] falhou ao carregar ${urlFailed}: ${description} (${code})`);

    if (!isPrincipal || code === -3 || appWindow.isDestroyed()) return;

    void appWindow.loadURL(waitPage("Sem conexão com o Gravaê"));
    loader.schedule();
  });

  appWindow.on("closed", () => loader.end());

  appWindow.webContents.setWindowOpenHandler(({ url }) => {
    const our = (() => {
      try {
        return new URL(url).origin === APP_ORIGIN;
      } catch {
        return false;
      }
    })();

    if (!our) {
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
        ...(process.platform === "darwin" ? {} : { icon: ICON }),
        webPreferences: {
          preload: path.join(__dirname, "preload.cjs"),
          additionalArguments: [`--gravae-nome=${isDev ? "Electron" : app.name}`],
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
        },
      },
    };
  });

  appWindow.webContents.on("will-navigate", (event, url) => {
    if (new URL(url).origin === APP_ORIGIN) return;
    event.preventDefault();
    void shell.openExternal(url);
  });

  appWindow.webContents.session.setPermissionRequestHandler((who, permission, allow, details) => {
    const origin = (() => {
      try {
        return new URL(details?.requestingUrl || who?.getURL() || "").origin;
      } catch {
        return null;
      }
    })();

    const our = origin === APP_ORIGIN;
    if (!our) {
      console.warn(`[desktop] permissão "${permission}" negada para ${origin ?? "origem desconhecida"}`);
    }

    allow(our);
  });

  void appWindow.loadURL(waitPage("Abrindo o Gravaê…")).then(async () => {
    await appWindow.webContents.session.clearCache().catch(() => undefined);
    await loader.load();
  });

  if (isDev && !app.isPackaged) appWindow.webContents.openDevTools({ mode: "detach" });

  return appWindow;
}
