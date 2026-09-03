import { app, ipcMain } from "electron";
import { arch, release } from "node:os";

import type { VersoesDoAplicativo } from "@gravae/shared";

/*
  O nome do sistema, escrito como a pessoa o conhece.

  `process.platform` diz "darwin" e o `os.release()` diz "26.1.0" — que é a
  versão do KERNEL, não a do macOS. Por muitos anos as duas divergiram (Darwin
  22 era macOS 13) e converter exigia uma tabela que envelhecia a cada outubro.
  Desde o macOS 26 a Apple alinhou os dois números, então o kernel serve; mas o
  RÓTULO continua sendo escolha nossa, e é por isso que ele mora aqui e não na
  tela.
*/
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
