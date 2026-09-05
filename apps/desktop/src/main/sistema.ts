import { app, ipcMain } from "electron";

const suportado = () => process.platform === "darwin" || process.platform === "win32";

export function registrarSistema() {
  ipcMain.handle("sistema:pode-abrir-no-login", () => suportado());

  ipcMain.handle("sistema:abrir-no-login", () =>
    suportado() ? app.getLoginItemSettings().openAtLogin : false,
  );

  ipcMain.handle("sistema:definir-abrir-no-login", (_e, ligado: boolean) => {
    if (!suportado()) return false;

    app.setLoginItemSettings({ openAtLogin: ligado, openAsHidden: ligado });

    return app.getLoginItemSettings().openAtLogin;
  });

  ipcMain.handle("sistema:reiniciar", () => {
    app.relaunch();
    app.quit();
  });
}
