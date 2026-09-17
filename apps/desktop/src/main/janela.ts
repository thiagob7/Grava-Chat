import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, isDev } from "./config.js";

const systemName = () => (isDev ? "Electron" : process.platform === "darwin" ? "Ravox Chat" : app.name);

const BRAND = `<svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="12" fill="#6467F2"/><path transform="translate(27.303 27.000) scale(0.10110)" fill-rule="evenodd" clip-rule="evenodd" d="M104 0L219 0L219 455L148 455L148 260L106 261L106 262L100 263L96 265L95 267L93 267L87 273L86 277L83 280L80 294L79 294L79 303L78 303L78 424L77 424L76 441L75 441L72 455L0 455L0 452L2 450L4 440L5 440L6 424L7 424L7 306L8 306L8 294L9 294L10 280L11 280L11 276L12 276L12 272L13 272L16 259L22 247L27 242L27 240L39 230L47 226L50 226L52 224L55 224L55 222L40 215L27 203L27 201L22 196L15 182L14 176L13 176L13 172L12 172L12 168L10 164L10 158L9 158L9 150L8 150L8 88L9 88L11 68L12 68L13 60L17 52L17 49L21 41L23 40L24 36L43 17L45 17L46 15L58 9L61 9L61 8L64 8L70 5L84 3L84 2L91 2L91 1L104 1ZM260 0L331 0L331 390L449 390L449 455L260 455ZM106 65L106 66L102 66L102 67L99 67L93 70L87 76L87 78L85 79L82 85L81 92L80 92L80 97L79 97L79 160L80 160L81 170L87 182L92 187L94 187L100 192L111 194L111 195L148 195L148 65Z" fill="white"/></svg>`;

function waitPage(reason: string) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    `<!doctype html><meta charset="utf-8">
     <body style="background:#121214;color:#e1e1e6;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;place-items:center;height:100vh;margin:0;-webkit-user-select:none">
       <div style="text-align:center;max-width:22rem;padding:0 24px">
         <div style="animation:respirar 2s ease-in-out infinite">${BRAND}</div>
         <h1 style="margin:28px 0 8px;font-size:17px;font-weight:600">${reason}</h1>
         <p style="margin:0;color:#a8a8b3">Isto volta sozinho assim que a conexão voltar — não precisa fechar o app.</p>
         <a href="${APP_URL}" style="display:inline-block;margin-top:22px;padding:9px 18px;border-radius:8px;background:#5c5ff0;color:#fff;text-decoration:none;font-weight:600">Tentar agora</a>
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
      additionalArguments: [`--gravae-nome=${systemName()}`],
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

    void appWindow.loadURL(waitPage("Sem conexão com o Ravox Chat"));
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
      if (/^https?:\/\//i.test(url)) void shell.openExternal(url);
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
          additionalArguments: [`--gravae-nome=${systemName()}`],
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: false,
        },
      },
    };
  });

  appWindow.webContents.on("will-navigate", (event, url) => {
    const target = (() => {
      try {
        return new URL(url);
      } catch {
        return null;
      }
    })();

    if (target?.origin === APP_ORIGIN) return;
    event.preventDefault();

    if (target && (target.protocol === "https:" || target.protocol === "http:")) {
      void shell.openExternal(target.href);
    }
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

  void appWindow.loadURL(waitPage("Abrindo o Ravox Chat…")).then(async () => {
    await appWindow.webContents.session.clearCache().catch(() => undefined);
    await loader.load();
  });

  if (isDev && !app.isPackaged) appWindow.webContents.openDevTools({ mode: "detach" });

  return appWindow;
}
