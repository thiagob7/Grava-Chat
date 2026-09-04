import { app, ipcMain } from "electron";
import { arch, release } from "node:os";

import type { VersoesDoAplicativo } from "@gravae/shared";

const NOMES: Record<string, string> = {
  darwin: "macOS",
  win32: "Windows",
  linux: "Linux",
};

function sistema(): string {
  const nome = NOMES[process.platform] ?? process.platform;
  return `${nome} ${release()} (${arch()})`;
}

export function registrarVersoes(): void {
  ipcMain.handle(
    "app:versoes",
    (): VersoesDoAplicativo => ({
      app: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      sistema: sistema(),
    }),
  );
}
