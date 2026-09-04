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

  ipcMain.handle("janela:focar", () => {
    const janela = janelaAtiva();
    if (!janela) return;

    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();
    if (process.platform === "darwin") app.focus({ steal: true });
  });
}
