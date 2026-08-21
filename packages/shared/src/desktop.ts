/**
 * O contrato da ponte do aplicativo de desktop (`window.gravae`).
 *
 * Mora aqui, e não dentro do app de desktop, porque tem dois lados: o preload
 * do Electron implementa, o front consome. Com o tipo em um lugar só, mudar a
 * assinatura de um lado quebra o typecheck do outro na hora — que é o ponto.
 */

export interface EstadoPtt {
  /** o gancho global está de pé e escutando a tecla */
  ativo: boolean;
  /** a biblioteca nativa não carregou nesta máquina */
  indisponivel: boolean;
  /** no macOS, falta liberar o app em Acessibilidade */
  precisaPermissao: boolean;
}

export interface OpcoesPtt {
  ativo: boolean;
  /** no formato de `KeyboardEvent.code`, igual ao que a tela grava */
  tecla: string;
}

export interface PontePtt {
  configurar: (opcoes: OpcoesPtt) => Promise<EstadoPtt>;
  pedirPermissao: (opcoes: OpcoesPtt) => Promise<EstadoPtt>;
  /** Só dispara com a janela FORA de foco; em foco quem manda é o front. */
  aoMudar: (callback: (pressionada: boolean) => void) => () => void;
}

/** Uma tela ou janela que dá pra compartilhar. */
export interface FonteDeTela {
  /** id do `desktopCapturer`, no formato "screen:0:0" ou "window:123:0" */
  id: string;
  nome: string;
  ehTela: boolean;
  /** PNG em data URL; `null` quando o sistema não devolveu nada */
  miniatura: string | null;
  /** ícone do aplicativo, só para janelas */
  icone: string | null;
}

export interface EscolhaDeTela {
  id: string;
  /** levar junto o som do sistema (o que o navegador não faz) */
  comAudio: boolean;
}

export interface PonteTela {
  /**
   * O aplicativo pede um seletor. O retorno cancela a inscrição; responder é
   * obrigatório — `null` quando a pessoa fecha sem escolher, senão o
   * `getDisplayMedia` fica pendurado.
   */
  aoPedirEscolha: (callback: (fontes: FonteDeTela[]) => void) => () => void;
  responder: (escolha: EscolhaDeTela | null) => void;
  /** "granted" | "denied" | "restricted" | "not-determined" */
  permissao: () => Promise<string>;
}

/** O que o navegador devolve pro aplicativo no fim do login com Google. */
export interface CodigoDeLogin {
  /** uso único, válido por 2 minutos */
  codigo: string;
  /** o original de que só o aplicativo tem cópia (PKCE) */
  verificador: string;
}

export interface PonteLogin {
  /** Abre o consentimento do Google no navegador do sistema. */
  iniciar: () => void;
  /**
   * Chega quando o navegador devolve o código por `gravae://auth`. Se o app foi
   * ABERTO pelo link, o código fica guardado e é entregue na inscrição.
   */
  aoReceber: (callback: (dados: CodigoDeLogin) => void) => () => void;
}

/** As três permissões de mídia que o macOS controla por app. */
export type TipoDeMidia = "microphone" | "camera" | "screen";

export interface PonteMidia {
  /** "granted" | "denied" | "restricted" | "not-determined" */
  status: (tipo: TipoDeMidia) => Promise<string>;
  /**
   * Garante a permissão do SISTEMA antes de tentar capturar. `false` significa
   * que só os Ajustes do Sistema resolvem — o pedido nativo aparece uma vez só.
   */
  garantir: (tipo: TipoDeMidia) => Promise<boolean>;
  /** Abre o painel exato dessa permissão nos Ajustes do Sistema. */
  abrirAjustes: (tipo: TipoDeMidia) => void;
}

export interface PonteDesktop {
  ehDesktop: true;
  /** "darwin", "win32", "linux" */
  plataforma: string;
  /**
   * Como o app aparece nas listas de permissão do sistema. Em desenvolvimento
   * quem executa é o Electron, e é o nome DELE que está lá — mandar a pessoa
   * procurar "Gravaê" numa lista onde só existe "Electron" é perder a viagem.
   */
  nomeNoSistema: string;
  ptt: PontePtt;
  tela: PonteTela;
  login: PonteLogin;
  midia: PonteMidia;
}

declare global {
  interface Window {
    /** só existe dentro do aplicativo de desktop */
    gravae?: PonteDesktop;
  }
}
