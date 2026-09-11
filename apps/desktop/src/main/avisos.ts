import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

export function registerNotices() {
  const fromCall = (event: IpcMainInvokeEvent) =>
    BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getAllWindows()[0] ?? null;

  ipcMain.handle("janela:contador", (_e, count: number) => {
    const number = Number.isFinite(count) ? Math.max(0, Math.trunc(count)) : 0;

    app.setBadgeCount(number);
  });

  ipcMain.handle("janela:chamar-atencao", (event) => {
    const appWindow = fromCall(event);
    if (!appWindow || appWindow.isFocused()) return;

    if (process.platform === "darwin") app.dock?.bounce("informational");
    else appWindow.flashFrame(true);
  });

  ipcMain.handle("janela:moldura-propria", () => process.platform !== "darwin");

  ipcMain.handle("janela:minimizar", (event) => fromCall(event)?.minimize());

  ipcMain.handle("janela:alternar-maximizada", (event) => {
    const appWindow = fromCall(event);
    if (!appWindow) return;

    if (appWindow.isMaximized()) appWindow.unmaximize();
    else appWindow.maximize();
  });

  ipcMain.handle("janela:fechar", (event) => fromCall(event)?.close());

  ipcMain.handle("janela:esta-maximizada", (event) => fromCall(event)?.isMaximized() ?? false);

  ipcMain.handle("janela:fixar-por-cima", (event, pin: boolean) => {
    const appWindow = fromCall(event);
    if (!appWindow) return false;

    appWindow.setAlwaysOnTop(Boolean(pin), "floating");
    return appWindow.isAlwaysOnTop();
  });

  ipcMain.handle("janela:esta-por-cima", (event) => fromCall(event)?.isAlwaysOnTop() ?? false);

  ipcMain.handle("janela:focar", (event) => {
    const appWindow = fromCall(event);
    if (!appWindow) return;

    if (appWindow.isMinimized()) appWindow.restore();
    appWindow.show();
    appWindow.focus();
    if (process.platform === "darwin") app.focus({ steal: true });
  });
}
