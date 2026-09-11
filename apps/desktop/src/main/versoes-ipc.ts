import { app, ipcMain } from "electron";
import { arch, release } from "node:os";

import type { AppVersions } from "@gravae/shared";

const NAMES: Record<string, string> = {
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
};

function system(): string {
  const name = NAMES[process.platform] ?? process.platform;
  return `${name} ${release()} (${arch()})`;
}

export function registerVersions(): void {
  ipcMain.handle(
    "app:versoes",
    (): AppVersions => ({
      app: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      system: system(),
    }),
  );
}
