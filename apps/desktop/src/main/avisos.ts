import { app, BrowserWindow, ipcMain } from "electron";

export function registrarAvisos() {
  const janelaAtiva = () => BrowserWindow.getAllWindows()[0] ?? null;

  ipcMain.handle("janela:contador", (_e, quantas: number) => {
    const numero = Number.isFinite(quantas) ? Math.max(0, Math.trunc(quantas)) : 0;

    app.setBadgeCount(numero);
  });

  ipcMain.handle("janela:chamar-atencao", () => {
    const janela = janelaAtiva();
    if (!janela || janela.isFocused()) return;

    if (process.platform === "darwin") app.dock?.bounce("informational");
    else janela.flashFrame(true);
  });

  /*
    Os controles da janela sem moldura. `molduraPropria` é o que o front usa
    para decidir se desenha os três botões: no macOS o sistema já desenha as
    bolinhas, e um segundo jogo de botões seria estranho.
  */
  ipcMain.handle("janela:moldura-propria", () => process.platform !== "darwin");

  ipcMain.handle("janela:minimizar", () => janelaAtiva()?.minimize());

  ipcMain.handle("janela:alternar-maximizada", () => {
    const janela = janelaAtiva();
    if (!janela) return;

    if (janela.isMaximized()) janela.unmaximize();
    else janela.maximize();
  });

  ipcMain.handle("janela:fechar", () => janelaAtiva()?.close());

  ipcMain.handle("janela:esta-maximizada", () => janelaAtiva()?.isMaximized() ?? false);

  ipcMain.handle("janela:focar", () => {
    const janela = janelaAtiva();
    if (!janela) return;

    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();
    if (process.platform === "darwin") app.focus({ steal: true });
  });
}
