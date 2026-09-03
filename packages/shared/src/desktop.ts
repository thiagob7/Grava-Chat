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
  /*
    "instalando" existe porque entre o clique e o app fechar há segundos de
    nada: o roteiro de troca precisa ser escrito no disco e o processo de fora
    precisa nascer. Sem uma fase para isso, o botão ficava intacto e a pessoa
    clicava de novo achando que não tinha pegado.
  */
  fase: "ociosa" | "procurando" | "baixando" | "pronta" | "instalando" | "erro";
  /// 0 a 1 enquanto baixa
  progresso: number;
  /*
    O que deu errado. Nem sempre acompanha a fase "erro": quando a troca falha
    ao começar, o app baixado continua no disco e a fase volta pra "pronta" —
    dá pra tentar de novo, e a mensagem é o que explica por que não foi da
    primeira vez.
  */
  erro: string | null;
}

/**
 * O aplicativo cuidando da própria versão.
 *
 * `instalar` troca o app no disco e reabre — só funciona depois que a `fase`
 * chega em "pronta". Ele não devolve sucesso nem falha: quando dá certo, o app
 * morre antes de responder; quando não dá, a resposta vem pelo estado.
 */
export interface PonteAtualizacao {
  estado: () => Promise<EstadoDaAtualizacao>;
  aoMudar: (callback: (estado: EstadoDaAtualizacao) => void) => () => void;
  procurar: () => Promise<EstadoDaAtualizacao>;
  baixar: () => Promise<EstadoDaAtualizacao>;
  instalar: () => Promise<void>;
}

/**
 * O que roda por baixo, para o rodapé das configurações.
 *
 * Só texto pronto para ler: quem monta cada linha é o processo principal, que
 * é o único que sabe a versão do aplicativo (`app.getVersion()`) e a do
 * sistema. Devolver os pedaços crus obrigaria a tela a saber que o macOS 26 se
 * chama assim mas se reporta como Darwin 26 — e essa tradução não é assunto
 * de uma tela de configuração.
 */
export interface VersoesDoAplicativo {
  /// a do aplicativo, como está no `package.json` que foi empacotado
  app: string;
  electron: string;
  chrome: string;
  /// "macOS 26.1.0 (arm64)", já escrito
  sistema: string;
}

/*
  A ponte que o aplicativo instalado oferece.

  **Tudo que entrar aqui depois de uma release precisa ser opcional.** O front
  vem do site a cada abertura; a casca só troca quando alguém instala uma
  versão nova. Então o normal — não a exceção — é este código rodar dentro de
  um aplicativo mais VELHO do que ele, onde o membro novo simplesmente não
  existe no objeto.

  Chamar um membro ausente estoura de forma síncrona (`x is not a function`),
  antes de existir promessa nenhuma: nenhum `.catch()` pega isso. Marcado como
  opcional, o TypeScript obriga quem chama a decidir o que fazer sem ele.
*/
export interface PonteDesktop {
  ehDesktop: true;
  plataforma: string;
  nomeNoSistema: string;
  /// chegou depois da v0.2.4 — ver o aviso acima
  versoes?: () => Promise<VersoesDoAplicativo>;
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
