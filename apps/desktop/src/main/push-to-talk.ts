import { BrowserWindow, ipcMain, shell, systemPreferences } from "electron";
import type { StatePtt, OptionsPtt } from "@gravae/shared";

function nameUiohook(code: string): string {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);

  const modifiers: Record<string, string> = {
    ControlLeft: "Ctrl",
    ControlRight: "CtrlRight",
    AltLeft: "Alt",
    AltRight: "AltRight",
    ShiftLeft: "Shift",
    ShiftRight: "ShiftRight",
    MetaLeft: "Meta",
    MetaRight: "MetaRight",
  };

  return modifiers[code] ?? code;
}

type Uiohook = typeof import("uiohook-napi");

let native: Uiohook | null = null;
let loaded = false;

function load(): Uiohook | null {
  if (loaded) return native;
  loaded = true;

  try {
    native = require("uiohook-napi") as Uiohook;
  } catch (error) {
    console.error("[desktop] uiohook indisponível, push-to-talk global desligado:", error);
    native = null;
  }

  return native;
}

function hasPermission(ask = false) {
  if (process.platform !== "darwin") return true;
  return systemPreferences.isTrustedAccessibilityClient(ask);
}

export function registerPushToTalk() {
  let listening = false;
  let keycodeTarget: number | null = null;
  let pressed = false;

  const notify = (value: boolean) => {
    if (value === pressed) return;
    pressed = value;

    for (const appWindow of BrowserWindow.getAllWindows()) {
      if (appWindow.isFocused()) continue;
      appWindow.webContents.send("ptt:mudou", value);
    }
  };

  const start = (hook: Uiohook) => {
    if (listening) return;

    hook.uIOhook.on("keydown", (e) => {
      if (e.keycode === keycodeTarget) notify(true);
    });
    hook.uIOhook.on("keyup", (e) => {
      if (e.keycode === keycodeTarget) notify(false);
    });

    hook.uIOhook.start();
    listening = true;
  };

  const stop = (hook: Uiohook) => {
    if (!listening) return;
    hook.uIOhook.removeAllListeners();
    hook.uIOhook.stop();
    listening = false;
    notify(false);
  };

  const apply = (active: boolean, key: string, askPermission = false): StatePtt => {
    const hook = load();
    if (!hook) return { active: false, unavailable: true, needsPermission: false };

    if (!active) {
      stop(hook);
      return { active: false, unavailable: false, needsPermission: !hasPermission() };
    }

    if (!hasPermission(askPermission)) {
      stop(hook);
      return { active: false, unavailable: false, needsPermission: true };
    }

    const name = nameUiohook(key) as keyof Uiohook["UiohookKey"];
    keycodeTarget = hook.UiohookKey[name] ?? null;
    if (keycodeTarget === null) {
      console.warn(`[desktop] tecla sem equivalente global: ${key}`);
      stop(hook);
      return { active: false, unavailable: true, needsPermission: false };
    }

    start(hook);
    return { active: true, unavailable: false, needsPermission: false };
  };

  ipcMain.handle("ptt:configurar", (_e, options: OptionsPtt) =>
    apply(options.active, options.key),
  );

  ipcMain.handle("ptt:pedir-permissao", (_e, options: OptionsPtt) => {
    const state = apply(options.active, options.key, true);

    if (state.needsPermission && process.platform === "darwin") {
      void shell.openExternal(
        "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
      );
    }

    return state;
  });

  return {
    end: () => {
      const hook = load();
      if (hook) stop(hook);
    },
  };
}
