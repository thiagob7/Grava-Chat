import { app, BrowserWindow, ipcMain } from "electron";

/**
 * O contador no ícone e o pedido de atenção.
 *
 * O aviso em si (a janelinha) é do próprio front, pela API `Notification` do
 * navegador — o Electron entrega a do sistema de graça. O que o navegador NÃO
 * faz é marcar o ícone do app: no macOS é o balãozinho vermelho no Dock, no
 * Windows e no Linux é a barra de tarefas piscando.
 */
export function registrarAvisos() {
  const janelaAtiva = () => BrowserWindow.getAllWindows()[0] ?? null;

  ipcMain.handle("janela:contador", (_e, quantas: number) => {
    const numero = Number.isFinite(quantas) ? Math.max(0, Math.trunc(quantas)) : 0;

    /// `setBadgeCount` existe nos três sistemas, mas só o macOS e alguns
    /// ambientes de Linux desenham alguma coisa. Onde não desenha, é um `no-op`
    /// silencioso — não vale ramificar por plataforma.
    app.setBadgeCount(numero);
  });

  ipcMain.handle("janela:chamar-atencao", () => {
    const janela = janelaAtiva();
    if (!janela || janela.isFocused()) return;

    /*
      No macOS quem pula é o Dock, e o pulo continua até o app receber foco —
      por isso `informational`, que dá um pulo só. Nos outros, é a barra de
      tarefas piscando, que para sozinha no foco.
    */
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
