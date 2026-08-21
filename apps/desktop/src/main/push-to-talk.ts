import { BrowserWindow, ipcMain, shell, systemPreferences } from "electron";
import type { EstadoPtt, OpcoesPtt } from "@gravae/shared";

/**
 * `KeyboardEvent.code` (o que a tela de configurações grava) para o nome que o
 * uiohook usa. A maior parte é idêntica — as exceções são as letras, os números
 * e os modificadores, que o uiohook não separa em "Left"/"Right" da mesma forma.
 */
function nomeUiohook(code: string): string {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);

  const modificadores: Record<string, string> = {
    ControlLeft: "Ctrl",
    ControlRight: "CtrlRight",
    AltLeft: "Alt",
    AltRight: "AltRight",
    ShiftLeft: "Shift",
    ShiftRight: "ShiftRight",
    MetaLeft: "Meta",
    MetaRight: "MetaRight",
  };

  return modificadores[code] ?? code;
}

type Uiohook = typeof import("uiohook-napi");

let nativo: Uiohook | null = null;
let carregou = false;

/**
 * O binário nativo só é carregado quando alguém liga o push-to-talk. Se a
 * máquina não tiver o `.node` compatível, o app segue funcionando com o
 * push-to-talk da janela — nunca deixa de abrir por causa disto.
 */
function carregar(): Uiohook | null {
  if (carregou) return nativo;
  carregou = true;

  try {
    nativo = require("uiohook-napi") as Uiohook;
  } catch (erro) {
    console.error("[desktop] uiohook indisponível, push-to-talk global desligado:", erro);
    nativo = null;
  }

  return nativo;
}

/**
 * No macOS o sistema só entrega tecla de fora do app pra quem está na lista de
 * Acessibilidade. `isTrustedAccessibilityClient(false)` pergunta sem incomodar;
 * com `true` o sistema mostra o pedido.
 */
function temPermissao(perguntar = false) {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(perguntar);
}

export function registrarPushToTalk() {
  let escutando = false;
  let keycodeAlvo: number | null = null;
  let pressionada = false;

  const avisar = (valor: boolean) => {
    if (valor === pressionada) return;
    pressionada = valor;

    for (const janela of BrowserWindow.getAllWindows()) {
      /**
       * Com a janela em foco quem manda é o front: o listener dele sabe se a
       * pessoa está digitando no chat, e aqui isso é invisível. Fora de foco —
       * que é o caso que importa, o jogo em primeiro plano — o global assume.
       */
      if (janela.isFocused()) continue;
      janela.webContents.send("ptt:mudou", valor);
    }
  };

  const iniciar = (hook: Uiohook) => {
    if (escutando) return;

    hook.uIOhook.on("keydown", (e) => {
      if (e.keycode === keycodeAlvo) avisar(true);
    });
    hook.uIOhook.on("keyup", (e) => {
      if (e.keycode === keycodeAlvo) avisar(false);
    });

    hook.uIOhook.start();
    escutando = true;
  };

  const parar = (hook: Uiohook) => {
    if (!escutando) return;
    hook.uIOhook.removeAllListeners();
    hook.uIOhook.stop();
    escutando = false;
    avisar(false);
  };

  const aplicar = (ativo: boolean, tecla: string, perguntarPermissao = false): EstadoPtt => {
    const hook = carregar();
    if (!hook) return { ativo: false, indisponivel: true, precisaPermissao: false };

    if (!ativo) {
      parar(hook);
      return { ativo: false, indisponivel: false, precisaPermissao: !temPermissao() };
    }

    if (!temPermissao(perguntarPermissao)) {
      parar(hook);
      return { ativo: false, indisponivel: false, precisaPermissao: true };
    }

    const nome = nomeUiohook(tecla) as keyof Uiohook["UiohookKey"];
    keycodeAlvo = hook.UiohookKey[nome] ?? null;
    if (keycodeAlvo === null) {
      console.warn(`[desktop] tecla sem equivalente global: ${tecla}`);
      parar(hook);
      return { ativo: false, indisponivel: true, precisaPermissao: false };
    }

    iniciar(hook);
    return { ativo: true, indisponivel: false, precisaPermissao: false };
  };

  ipcMain.handle("ptt:configurar", (_e, opcoes: OpcoesPtt) =>
    aplicar(opcoes.ativo, opcoes.tecla),
  );

  /**
   * O pedido do macOS só aparece uma vez por app; depois disso o caminho é a
   * tela de ajustes. Abrimos as duas coisas — o pedido e a tela — porque a
   * pessoa precisa reiniciar o app depois de marcar a caixinha.
   */
  ipcMain.handle("ptt:pedir-permissao", (_e, opcoes: OpcoesPtt) => {
    const estado = aplicar(opcoes.ativo, opcoes.tecla, true);

    if (estado.precisaPermissao && process.platform === "darwin") {
      void shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
      );
    }

    return estado;
  });

  return {
    encerrar: () => {
      const hook = carregar();
      if (hook) parar(hook);
    },
  };
}
