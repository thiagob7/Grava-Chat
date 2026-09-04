import { BrowserWindow, ipcMain } from "electron";
import type { EstadoDaAtualizacao } from "@gravae/shared";

import { criarAtualizador } from "./atualizacao.js";

export function registrarAtualizacao(janela: () => BrowserWindow | null) {
  const avisar = (estado: EstadoDaAtualizacao) => {
    const alvo = janela();
    if (alvo && !alvo.isDestroyed()) alvo.webContents.send("atualizacao:mudou", estado);
  };

  const atualizador = criarAtualizador(avisar);

  ipcMain.handle("atualizacao:estado", () => atualizador.estado());
  ipcMain.handle("atualizacao:procurar", () => atualizador.procurar());
  ipcMain.handle("atualizacao:baixar", () => atualizador.baixar());
  ipcMain.handle("atualizacao:instalar", () => atualizador.instalar());

  atualizador.vigiar();

  return atualizador;
}
