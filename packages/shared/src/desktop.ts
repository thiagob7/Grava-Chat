export interface EstadoPtt {
  ativo: boolean;
  indisponivel: boolean;
  precisaPermissao: boolean;
}

export interface OpcoesPtt {
  ativo: boolean;
  tecla: string;
}

export interface PontePtt {
  configurar: (opcoes: OpcoesPtt) => Promise<EstadoPtt>;
  pedirPermissao: (opcoes: OpcoesPtt) => Promise<EstadoPtt>;
  aoMudar: (callback: (pressionada: boolean) => void) => () => void;
}

export interface FonteDeTela {
  id: string;
  nome: string;
  ehTela: boolean;
  miniatura: string | null;
  icone: string | null;
}

export interface EscolhaDeTela {
  id: string;
  comAudio: boolean;
}

export interface PonteTela {
  aoPedirEscolha: (callback: (fontes: FonteDeTela[]) => void) => () => void;
  responder: (escolha: EscolhaDeTela | null) => void;
  permissao: () => Promise<string>;
}

export interface CodigoDeLogin {
  codigo: string;
  verificador: string;
}

export interface PonteLogin {
  iniciar: () => void;
  aoReceber: (callback: (dados: CodigoDeLogin) => void) => () => void;
}

export type TipoDeMidia = "microphone" | "camera" | "screen";

export interface PonteMidia {
  status: (tipo: TipoDeMidia) => Promise<string>;
  garantir: (tipo: TipoDeMidia) => Promise<boolean>;
  abrirAjustes: (tipo: TipoDeMidia) => void;
}

/**
 * O que o app de desktop faz e o navegador não: marcar o ícone.
 *
 * A janelinha do aviso é a `Notification` do próprio navegador nos dois — o
 * Electron entrega a do sistema sem ponte nenhuma. O que falta lá é o
 * contador no Dock, o pulo/piscada e trazer a janela para a frente quando
 * alguém clica no aviso.
 */
export interface PonteJanela {
  contador: (quantas: number) => Promise<void>;
  chamarAtencao: () => Promise<void>;
  focar: () => Promise<void>;
}

export interface PonteDesktop {
  ehDesktop: true;
  plataforma: string;
  nomeNoSistema: string;
  ptt: PontePtt;
  tela: PonteTela;
  login: PonteLogin;
  midia: PonteMidia;
  janela: PonteJanela;
}

declare global {
  interface Window {
    gravae?: PonteDesktop;
  }
}
