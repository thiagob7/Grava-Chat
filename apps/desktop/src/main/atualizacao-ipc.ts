import { BrowserWindow, ipcMain } from "electron";
import type { EstadoDaAtualizacao } from "@gravae/shared";

import { criarAtualizador } from "./atualizacao.js";

/*
  A ponte entre o motor da atualização e a faixa que o site desenha.

  Empurrar o estado (`atualizacao:mudou`) em vez de deixar a tela perguntar de
  tempos em tempos: o download leva minutos, e uma barra de progresso que só
  anda quando alguém pergunta não é barra de progresso.
*/
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
