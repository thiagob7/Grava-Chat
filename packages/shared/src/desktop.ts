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

/**
 * Links `gravae://` que o sistema entrega ao aplicativo.
 *
 * `gravae://invite/ABC` vira a rota `/invite/ABC` dentro da janela — quem
 * clica num convite no navegador cai no app já aberto em vez de numa segunda
 * cópia do Gravaê rodando na aba.
 */
export interface PonteLinks {
  aoAbrir: (callback: (rota: string) => void) => () => void;
}

/**
 * Estado da atualização do aplicativo.
 *
 * O aviso e o botão moram no SITE, e não numa janela nativa, de propósito: o
 * site se atualiza sozinho, então o texto, o desenho e o comportamento da faixa
 * podem melhorar depois sem obrigar ninguém a instalar de novo. Só o motor —
 * checar, baixar, trocar o app — precisa morar na casca.
 *
 * Por isso este contrato é mínimo e genérico: cada campo que ele ganha é um
 * instalador novo para todo mundo, e a graça de existir é justamente acabar
 * com isso.
 */
export interface EstadoDaAtualizacao {
  /// versão que está rodando agora
  atual: string;
  /// versão publicada, quando há uma mais nova; `null` quando estamos em dia
  disponivel: string | null;
  fase: "ociosa" | "procurando" | "baixando" | "pronta" | "erro";
  /// 0 a 1 enquanto baixa
  progresso: number;
  /// o que deu errado, quando `fase` é "erro"
  erro: string | null;
}

/**
 * O aplicativo cuidando da própria versão.
 *
 * `instalar` troca o app no disco e reabre — só funciona depois que a `fase`
 * chega em "pronta".
 */
export interface PonteAtualizacao {
  estado: () => Promise<EstadoDaAtualizacao>;
  aoMudar: (callback: (estado: EstadoDaAtualizacao) => void) => () => void;
  procurar: () => Promise<EstadoDaAtualizacao>;
  baixar: () => Promise<EstadoDaAtualizacao>;
  instalar: () => Promise<void>;
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
  links: PonteLinks;
  atualizacao: PonteAtualizacao;
}

declare global {
  interface Window {
    gravae?: PonteDesktop;
  }
}
