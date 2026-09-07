import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";

export function registrarAvisos() {
  /*
    A janela de quem chamou, e não "a primeira" — desde que o estúdio de temas
    abre numa janela própria, existe mais de uma. Minimizar dali tem que
    minimizar o estúdio, não o app atrás dele.
  */
  const daChamada = (evento: IpcMainInvokeEvent) =>
    BrowserWindow.fromWebContents(evento.sender) ?? BrowserWindow.getAllWindows()[0] ?? null;

  ipcMain.handle("janela:contador", (_e, quantas: number) => {
    const numero = Number.isFinite(quantas) ? Math.max(0, Math.trunc(quantas)) : 0;

    app.setBadgeCount(numero);
  });

  ipcMain.handle("janela:chamar-atencao", (evento) => {
    const janela = daChamada(evento);
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

  ipcMain.handle("janela:minimizar", (evento) => daChamada(evento)?.minimize());

  ipcMain.handle("janela:alternar-maximizada", (evento) => {
    const janela = daChamada(evento);
    if (!janela) return;

    if (janela.isMaximized()) janela.unmaximize();
    else janela.maximize();
  });

  ipcMain.handle("janela:fechar", (evento) => daChamada(evento)?.close());

  ipcMain.handle("janela:esta-maximizada", (evento) => daChamada(evento)?.isMaximized() ?? false);

  /*
    "floating" é o nível mais baixo que fica por cima: a janela sobe acima dos
    outros aplicativos, mas continua abaixo de menu e de tela cheia do sistema.
    Devolve como de fato ficou.
  */
  ipcMain.handle("janela:fixar-por-cima", (evento, fixar: boolean) => {
    const janela = daChamada(evento);
    if (!janela) return false;

    janela.setAlwaysOnTop(Boolean(fixar), "floating");
    return janela.isAlwaysOnTop();
  });

  ipcMain.handle("janela:esta-por-cima", (evento) => daChamada(evento)?.isAlwaysOnTop() ?? false);

  ipcMain.handle("janela:focar", (evento) => {
    const janela = daChamada(evento);
    if (!janela) return;

    if (janela.isMinimized()) janela.restore();
    janela.show();
    janela.focus();
    if (process.platform === "darwin") app.focus({ steal: true });
  });
}
