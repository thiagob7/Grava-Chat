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
}

declare global {
  interface Window {
    gravae?: BridgeDesktop;
  }
}
