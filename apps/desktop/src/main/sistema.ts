import { app, ipcMain } from "electron";

const supported = () => process.platform === "darwin" || process.platform === "win32";

export function registerSystem() {
  ipcMain.handle("sistema:pode-abrir-no-login", () => supported());

  ipcMain.handle("sistema:abrir-no-login", () =>
    supported() ? app.getLoginItemSettings().openAtLogin : false,
  );

  ipcMain.handle("sistema:definir-abrir-no-login", (_e, on: boolean) => {
    if (!supported()) return false;

    app.setLoginItemSettings({ openAtLogin: on, openAsHidden: on });

    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle("sistema:reiniciar", () => {
    app.relaunch();
    app.quit();
  });
}
