import { contextBridge, ipcRenderer } from "electron";
import type {
  LoginCode,
  UpdateState,
  ScreenChoice,
  StatePtt,
  ScreenFont,
  OptionsPtt,
  BridgeDesktop,
  MediaKind,
  AppVersions,
} from "@gravae/shared";

const bridge: BridgeDesktop = {
  isDesktop: true as const,
  platform: process.platform,
  nameSystem:
    process.argv.find((a) => a.startsWith("--gravae-nome="))?.split("=")[1] ?? "Gravaê",

  versions: (): Promise<AppVersions> => ipcRenderer.invoke("app:versoes"),

  ptt: {
    configure: (options: OptionsPtt): Promise<StatePtt> =>
      ipcRenderer.invoke("ptt:configurar", options),

    requestPermission: (options: OptionsPtt): Promise<StatePtt> =>
      ipcRenderer.invoke("ptt:pedir-permissao", options),

    onChange: (callback: (pressed: boolean) => void) => {
      const listener = (_e: unknown, pressed: boolean) => callback(pressed);
      ipcRenderer.on("ptt:mudou", listener);
      return () => ipcRenderer.off("ptt:mudou", listener);
    },
  },

  display: {
    onRequestChoice: (callback: (fonts: ScreenFont[]) => void) => {
      const listener = (_e: unknown, fonts: ScreenFont[]) => callback(fonts);
      ipcRenderer.on("tela:escolher", listener);
      return () => ipcRenderer.off("tela:escolher", listener);
    },

    reply: (selection: ScreenChoice | null) => {
      void ipcRenderer.invoke("tela:escolhida", selection);
    },

    permission: (): Promise<string> => ipcRenderer.invoke("tela:permissao"),
  },

  media: {
    status: (kind: MediaKind): Promise<string> => ipcRenderer.invoke("midia:status", kind),

    ensure: (kind: MediaKind): Promise<boolean> => ipcRenderer.invoke("midia:garantir", kind),

    openSettings: (kind: MediaKind) => {
      void ipcRenderer.invoke("midia:abrir-ajustes", kind);
    },
  },

  appWindow: {
    counter: (count: number): Promise<void> => ipcRenderer.invoke("janela:contador", count),
    callAttention: (): Promise<void> => ipcRenderer.invoke("janela:chamar-atencao"),
    focus: (): Promise<void> => ipcRenderer.invoke("janela:focar"),

    minimize: (): Promise<void> => ipcRenderer.invoke("janela:minimizar"),
    toggleMaximized: (): Promise<void> =>
      ipcRenderer.invoke("janela:alternar-maximizada"),
    close: (): Promise<void> => ipcRenderer.invoke("janela:fechar"),
    frameOwn: (): Promise<boolean> => ipcRenderer.invoke("janela:moldura-propria"),
    thisMaximized: (): Promise<boolean> => ipcRenderer.invoke("janela:esta-maximizada"),
    pinByUp: (pin: boolean): Promise<boolean> =>
      ipcRenderer.invoke("janela:fixar-por-cima", pin),
    thisByUp: (): Promise<boolean> => ipcRenderer.invoke("janela:esta-por-cima"),

    onChangeMaximized: (callback: (maximized: boolean) => void) => {
      const listener = (_e: unknown, maximized: boolean) => callback(maximized);
      ipcRenderer.on("janela:maximizada", listener);
      return () => ipcRenderer.off("janela:maximizada", listener);
    },
  },

  login: {
    start: () => {
      void ipcRenderer.invoke("login:iniciar");
    },

    onReceive: (callback: (data: LoginCode) => void) => {
      const listener = (_e: unknown, data: LoginCode) => callback(data);
      ipcRenderer.on("login:codigo", listener);

      void ipcRenderer
        .invoke("login:pendente")
        .then((data: LoginCode | null) => data && callback(data));

      return () => ipcRenderer.off("login:codigo", listener);
    },
  },

  links: {
    onOpen: (callback: (route: string) => void) => {
      const listener = (_e: unknown, route: string) => callback(route);
      ipcRenderer.on("link:abrir", listener);

      void ipcRenderer
        .invoke("link:pendente")
        .then((route: string | null) => route && callback(route));

      return () => ipcRenderer.off("link:abrir", listener);
    },
  },

  update: {
    state: () => ipcRenderer.invoke("atualizacao:estado"),
    lookup: () => ipcRenderer.invoke("atualizacao:procurar"),
    download: () => ipcRenderer.invoke("atualizacao:baixar"),
    install: () => ipcRenderer.invoke("atualizacao:instalar"),

    onChange: (callback: (state: UpdateState) => void) => {
      const listener = (_e: unknown, state: UpdateState) => callback(state);
      ipcRenderer.on("atualizacao:mudou", listener);

      return () => ipcRenderer.off("atualizacao:mudou", listener);
    },
  },

  system: {
    canOpenLogin: (): Promise<boolean> => ipcRenderer.invoke("sistema:pode-abrir-no-login"),
    openLogin: (): Promise<boolean> => ipcRenderer.invoke("sistema:abrir-no-login"),
    setOpenLogin: (on: boolean): Promise<boolean> =>
      ipcRenderer.invoke("sistema:definir-abrir-no-login", on),
    restart: (): Promise<void> => ipcRenderer.invoke("sistema:reiniciar"),
  },
};

contextBridge.exposeInMainWorld("gravae", bridge);
