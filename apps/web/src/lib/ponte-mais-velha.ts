import type {
  BridgeDesktop,
  LoginCode,
  MediaKind,
  OptionsPtt,
  ScreenChoice,
  ScreenFont,
  StatePtt,
} from "@gravae/shared";

/*
  A ponte como ela PODE chegar, não como queremos que chegue.

  O site sobe sozinho quando um merge entra na master; a casca do aplicativo só
  muda quando alguém reconstrói e reinstala. Os dois nunca estão em passo, e o
  site novo roda dentro da casca antiga por semanas.

  Em 11/09/2026 o código do repositório passou a ser escrito em inglês, e os
  nomes da ponte foram junto. O site novo pediu `login.onReceive`, a casca de
  07/09 só tinha `login.aoReceber`, e a chamada estourou dentro do provedor de
  sessão — que roda no boot, então a janela ficou preta sem desenhar nada.

  Aqui é o único ponto por onde a ponte passa, então é aqui que o nome antigo
  vira o novo. Casca nova não casa com nada disto e sai de graça.

  O que a casca velha não tem — links, atualização, sistema e versões — fica de
  fora, e é por isso que esses quatro são opcionais no contrato.
*/

interface OldPtt {
  configurar: (options: { ativo: boolean; tecla: string }) => Promise<OldStatePtt>;
  pedirPermissao: (options: { ativo: boolean; tecla: string }) => Promise<OldStatePtt>;
  aoMudar: (callback: (pressed: boolean) => void) => () => void;
}

interface OldStatePtt {
  ativo: boolean;
  indisponivel: boolean;
  precisaPermissao: boolean;
}

interface OldScreenFont {
  id: string;
  nome: string;
  ehTela: boolean;
  miniatura: string | null;
  icone: string | null;
}

interface OldBridge {
  ehDesktop: true;
  plataforma: string;
  nomeNoSistema: string;
  ptt: OldPtt;
  tela: {
    aoPedirEscolha: (callback: (fonts: OldScreenFont[]) => void) => () => void;
    responder: (selection: { id: string; comAudio: boolean } | null) => void;
    permissao: () => Promise<string>;
  };
  login: {
    iniciar: () => void;
    aoReceber: (callback: (data: { codigo: string; verificador: string }) => void) => () => void;
  };
  midia: {
    status: (kind: MediaKind) => Promise<string>;
    garantir: (kind: MediaKind) => Promise<boolean>;
    abrirAjustes: (kind: MediaKind) => void;
  };
  janela: {
    contador: (count: number) => Promise<void>;
    chamarAtencao: () => Promise<void>;
    focar: () => Promise<void>;
  };
}

const isOld = (bridge: unknown): bridge is OldBridge =>
  Boolean(bridge) && typeof bridge === "object" && "ehDesktop" in (bridge as object);

const stateOf = (state: OldStatePtt): StatePtt => ({
  active: state.ativo,
  unavailable: state.indisponivel,
  needsPermission: state.precisaPermissao,
});

const optionsOf = (options: OptionsPtt) => ({ ativo: options.active, tecla: options.key });

const fontOf = (font: OldScreenFont): ScreenFont => ({
  id: font.id,
  name: font.nome,
  isScreen: font.ehTela,
  thumbnail: font.miniatura,
  icon: font.icone,
});

const codeOf = (data: { codigo: string; verificador: string }): LoginCode => ({
  code: data.codigo,
  verifier: data.verificador,
});

export function comNomesNovos(bridge: BridgeDesktop | null): BridgeDesktop | null {
  if (!isOld(bridge)) return bridge;

  const old = bridge;

  return {
    isDesktop: true,
    platform: old.plataforma,
    nameSystem: old.nomeNoSistema,

    ptt: {
      configure: (options) => old.ptt.configurar(optionsOf(options)).then(stateOf),
      requestPermission: (options) => old.ptt.pedirPermissao(optionsOf(options)).then(stateOf),
      onChange: (callback) => old.ptt.aoMudar(callback),
    },

    display: {
      onRequestChoice: (callback) =>
        old.tela.aoPedirEscolha((fonts) => callback(fonts.map(fontOf))),
      reply: (selection: ScreenChoice | null) =>
        old.tela.responder(selection && { id: selection.id, comAudio: selection.withAudio }),
      permission: () => old.tela.permissao(),
    },

    login: {
      start: () => old.login.iniciar(),
      onReceive: (callback) => old.login.aoReceber((data) => callback(codeOf(data))),
    },

    media: {
      status: (kind) => old.midia.status(kind),
      ensure: (kind) => old.midia.garantir(kind),
      openSettings: (kind) => old.midia.abrirAjustes(kind),
    },

    appWindow: {
      counter: (count) => old.janela.contador(count),
      callAttention: () => old.janela.chamarAtencao(),
      focus: () => old.janela.focar(),
    },
  };
}
