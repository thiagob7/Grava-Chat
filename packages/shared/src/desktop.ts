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

export interface PonteJanela {
  contador: (quantas: number) => Promise<void>;
  chamarAtencao: () => Promise<void>;
  focar: () => Promise<void>;
}

export interface PonteLinks {
  aoAbrir: (callback: (rota: string) => void) => () => void;
}

export interface EstadoDaAtualizacao {
  atual: string;
  disponivel: string | null;
  fase: "ociosa" | "procurando" | "baixando" | "pronta" | "instalando" | "erro";
  progresso: number;
  erro: string | null;
}

export interface PonteAtualizacao {
  estado: () => Promise<EstadoDaAtualizacao>;
  aoMudar: (callback: (estado: EstadoDaAtualizacao) => void) => () => void;
  procurar: () => Promise<EstadoDaAtualizacao>;
  baixar: () => Promise<EstadoDaAtualizacao>;
  instalar: () => Promise<void>;
}

export interface VersoesDoAplicativo {
  app: string;
  electron: string;
  chrome: string;
  sistema: string;
}

export interface PonteSistema {
  abrirNoLogin: () => Promise<boolean>;
  definirAbrirNoLogin: (ligado: boolean) => Promise<boolean>;
  podeAbrirNoLogin: () => Promise<boolean>;
  reiniciar: () => Promise<void>;
}

export interface PonteDesktop {
  ehDesktop: true;
  plataforma: string;
  nomeNoSistema: string;
  versoes?: () => Promise<VersoesDoAplicativo>;
  ptt: PontePtt;
  tela: PonteTela;
  login: PonteLogin;
  midia: PonteMidia;
  janela: PonteJanela;
  links: PonteLinks;
  atualizacao: PonteAtualizacao;
  sistema?: PonteSistema;
}

declare global {
  interface Window {
    gravae?: PonteDesktop;
  }
}
