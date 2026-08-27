import { app, BrowserWindow, ipcMain } from "electron";

const ESQUEMA = "gravae";

/*
  O que vem depois do `gravae://` é a rota do app: `gravae://invite/ABC` abre
  `/invite/ABC`. O host `auth` fica de fora porque é o retorno do login — quem
  cuida dele é o login-desktop.
*/
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

    /*
      Sem janela pronta o link fica guardado: foi ele que abriu o app, e o
      preload vem buscar assim que a tela monta.
    */
    if (!janela || janela.webContents.isLoading()) {
      pendente = rota;
      return;
    }

    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();

    /*
      A rota vai pelo preload em vez de um loadURL: a janela é o site inteiro,
      e recarregar derrubaria quem está numa chamada de voz só porque clicou
      num convite.
    */
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
