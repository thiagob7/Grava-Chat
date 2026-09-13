export interface StatePtt {
  active: boolean;
  unavailable: boolean;
  needsPermission: boolean;
}

export interface OptionsPtt {
  active: boolean;
  key: string;
}

export interface BridgePtt {
  configure: (options: OptionsPtt) => Promise<StatePtt>;
  requestPermission: (options: OptionsPtt) => Promise<StatePtt>;
  onChange: (callback: (pressed: boolean) => void) => () => void;
}

export interface ScreenFont {
  id: string;
  name: string;
  isScreen: boolean;
  thumbnail: string | null;
  icon: string | null;
}

export interface ScreenChoice {
  id: string;
  withAudio: boolean;
}

export interface BridgeScreen {
  onRequestChoice: (callback: (fonts: ScreenFont[]) => void) => () => void;
  reply: (selection: ScreenChoice | null) => void;
  permission: () => Promise<string>;
}

export interface LoginCode {
  code: string;
  verifier: string;
}

export interface BridgeLogin {
  start: () => void;
  onReceive: (callback: (data: LoginCode) => void) => () => void;
}

export type MediaKind = "microphone" | "camera" | "screen";

export interface BridgeMedia {
  status: (kind: MediaKind) => Promise<string>;
  ensure: (kind: MediaKind) => Promise<boolean>;
  openSettings: (kind: MediaKind) => void;
}

export interface BridgeWindow {
  counter: (count: number) => Promise<void>;
  callAttention: () => Promise<void>;
  focus: () => Promise<void>;
  minimize?: () => Promise<void>;
  toggleMaximized?: () => Promise<void>;
  close?: () => Promise<void>;
  frameOwn?: () => Promise<boolean>;
  thisMaximized?: () => Promise<boolean>;
  onChangeMaximized?: (callback: (maximized: boolean) => void) => () => void;
  pinByUp?: (pin: boolean) => Promise<boolean>;
  thisByUp?: () => Promise<boolean>;
}

export interface BridgeLinks {
  onOpen: (callback: (route: string) => void) => () => void;
}

export interface UpdateState {
  current: string;
  available: string | null;
  phase: "ociosa" | "procurando" | "baixando" | "pronta" | "instalando" | "erro";
  progress: number;
  error: string | null;
}

export interface BridgeUpdate {
  state: () => Promise<UpdateState>;
  onChange: (callback: (state: UpdateState) => void) => () => void;
  lookup: () => Promise<UpdateState>;
  download: () => Promise<UpdateState>;
  install: () => Promise<void>;
}

export interface AppVersions {
  app: string;
  electron: string;
  chrome: string;
  system: string;
}

export interface BridgeSystem {
  openLogin: () => Promise<boolean>;
  setOpenLogin: (on: boolean) => Promise<boolean>;
  canOpenLogin: () => Promise<boolean>;
  restart: () => Promise<void>;
}

/*
  O cache local de conversa, que só existe no aplicativo de desktop.

  Nada aqui é fonte da verdade: é cópia do que a API já mandou, guardada em
  SQLite no disco de quem usa, para a conversa pintar antes da rede responder.
  Some tudo sem prejuízo — na próxima abertura o aplicativo baixa de novo.

  Por isso a ponte é opcional em toda parte: no navegador ela não existe, e o
  aplicativo tem que funcionar igual sem ela.
*/
export interface BridgeCache {
  /** Abre (ou troca) o banco da conta. Responde `false` se o id não presta. */
  open: (accountId: string) => Promise<boolean>;
  close: () => Promise<void>;

  read: (channelId: string, limit?: number) => Promise<unknown[]>;
  write: (channelId: string, messages: unknown[]) => Promise<number>;

  forgetMessage: (messageId: string) => Promise<void>;
  forgetChannel: (channelId: string) => Promise<void>;

  /** Aplica os limites de idade e de quantidade. Devolve quantas saíram. */
  prune: () => Promise<number>;
  size: () => Promise<{ messages: number; channels: number }>;
}

/** Uma mensagem escrita que ainda não chegou ao servidor. */
export interface QueuedSend {
  nonce: string;
  channelId: string;
  createdAt: number;
  tries: number;
  payload: unknown;
}

/*
  A fila de saída, que também só existe no aplicativo de desktop.

  Ela guarda o que a pessoa escreveu sem conexão, para sair sozinha quando a
  rede voltar. No navegador não existe, e a mensagem falha como sempre falhou —
  aba fechada leva junto o que estava esperando, então prometer fila lá seria
  prometer o que não se pode cumprir.
*/
export interface BridgeQueue {
  put: (nonce: string, channelId: string, payload: unknown) => Promise<void>;
  list: () => Promise<QueuedSend[]>;
  take: (nonce: string) => Promise<void>;

  /** Conta mais uma tentativa e devolve o total desta mensagem. */
  tried: (nonce: string) => Promise<number>;

  /** Descarta o que não vai mais sair, e devolve o que foi descartado. */
  prune: () => Promise<QueuedSend[]>;
}

export interface BridgeDesktop {
  isDesktop: true;
  platform: string;
  nameSystem: string;
  versions?: () => Promise<AppVersions>;
  ptt: BridgePtt;
  display: BridgeScreen;
  login: BridgeLogin;
  media: BridgeMedia;
  appWindow: BridgeWindow;
  links?: BridgeLinks;
  update?: BridgeUpdate;
  system?: BridgeSystem;
  cache?: BridgeCache;
  queue?: BridgeQueue;
}

declare global {
  interface Window {
    gravae?: BridgeDesktop;
  }
}
