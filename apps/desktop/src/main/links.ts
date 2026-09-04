import { app, BrowserWindow, ipcMain } from "electron";

const ESQUEMA = "gravae";

export function rotaDoLink(url: string): string | null {
  if (!url.startsWith(`${ESQUEMA}://`)) return null;

  const { host, pathname, search } = new URL(url);
  if (!host || host === "auth") return null;

  return `/${host}${pathname}${search}`;
}

export function registrarLinks() {
  let pendente: string | null = null;

  const abrir = (url: string) => {
    const rota = rotaDoLink(url);
    if (!rota) return;

    const janela = BrowserWindow.getAllWindows()[0];

    if (!janela || janela.webContents.isLoading()) {
      pendente = rota;
      return;
    }

    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();

    janela.webContents.send("link:abrir", rota);
  };

  app.on("open-url", (evento, url) => {
    evento.preventDefault();
    abrir(url);
  });

  ipcMain.handle("link:pendente", () => {
    const rota = pendente;
    pendente = null;
    return rota;
  });

  return { abrir };
}
