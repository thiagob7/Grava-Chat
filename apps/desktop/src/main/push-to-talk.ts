import { BrowserWindow, ipcMain, shell, systemPreferences } from "electron";
import type { EstadoPtt, OpcoesPtt } from "@gravae/shared";

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
