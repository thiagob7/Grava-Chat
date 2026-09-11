import { app, BrowserWindow, ipcMain } from "electron";

const SCHEMA = "gravae";

export function linkRoute(url: string): string | null {
  if (!url.startsWith(`${SCHEMA}://`)) return null;

  const { host, pathname, search } = new URL(url);
  if (!host || host === "auth") return null;

  return `/${host}${pathname}${search}`;
}

export function registerLinks() {
  let pending: string | null = null;

  const open = (url: string) => {
    const route = linkRoute(url);
    if (!route) return;

    const appWindow = BrowserWindow.getAllWindows()[0];

    if (!appWindow || appWindow.webContents.isLoading()) {
      pending = route;
      return;
    }

    if (appWindow.isMinimized()) appWindow.restore();
    appWindow.show();
    appWindow.focus();

    appWindow.webContents.send("link:abrir", route);
  };

  app.on("open-url", (event, url) => {
    event.preventDefault();
    open(url);
  });

  ipcMain.handle("link:pendente", () => {
    const route = pending;
    pending = null;
    return route;
  });

  return { open };
}
