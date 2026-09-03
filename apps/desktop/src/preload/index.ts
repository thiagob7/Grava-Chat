import { contextBridge, ipcRenderer } from "electron";
import type {
  CodigoDeLogin,
  EstadoDaAtualizacao,
  EscolhaDeTela,
  EstadoPtt,
  FonteDeTela,
  OpcoesPtt,
  PonteDesktop,
  TipoDeMidia,
  VersoesDoAplicativo,
} from "@gravae/shared";

const ponte: PonteDesktop = {
  ehDesktop: true as const,
  plataforma: process.platform,
  nomeNoSistema:
    process.argv.find((a) => a.startsWith("--gravae-nome="))?.split("=")[1] ?? "Gravaê",

  versoes: (): Promise<VersoesDoAplicativo> => ipcRenderer.invoke("app:versoes"),

  ptt: {
    configurar: (opcoes: OpcoesPtt): Promise<EstadoPtt> =>
      ipcRenderer.invoke("ptt:configurar", opcoes),

    pedirPermissao: (opcoes: OpcoesPtt): Promise<EstadoPtt> =>
      ipcRenderer.invoke("ptt:pedir-permissao", opcoes),

    aoMudar: (callback: (pressionada: boolean) => void) => {
      const ouvinte = (_e: unknown, pressionada: boolean) => callback(pressionada);
      ipcRenderer.on("ptt:mudou", ouvinte);
      return () => ipcRenderer.off("ptt:mudou", ouvinte);
    },
  },

  tela: {
    aoPedirEscolha: (callback: (fontes: FonteDeTela[]) => void) => {
      const ouvinte = (_e: unknown, fontes: FonteDeTela[]) => callback(fontes);
      ipcRenderer.on("tela:escolher", ouvinte);
      return () => ipcRenderer.off("tela:escolher", ouvinte);
    },

    responder: (escolha: EscolhaDeTela | null) => {
      void ipcRenderer.invoke("tela:escolhida", escolha);
    },

    permissao: (): Promise<string> => ipcRenderer.invoke("tela:permissao"),
  },

  midia: {
    status: (tipo: TipoDeMidia): Promise<string> => ipcRenderer.invoke("midia:status", tipo),

    garantir: (tipo: TipoDeMidia): Promise<boolean> => ipcRenderer.invoke("midia:garantir", tipo),

    abrirAjustes: (tipo: TipoDeMidia) => {
      void ipcRenderer.invoke("midia:abrir-ajustes", tipo);
    },
  },

  janela: {
    contador: (quantas: number): Promise<void> => ipcRenderer.invoke("janela:contador", quantas),
    chamarAtencao: (): Promise<void> => ipcRenderer.invoke("janela:chamar-atencao"),
    focar: (): Promise<void> => ipcRenderer.invoke("janela:focar"),
  },

  login: {
    iniciar: () => {
      void ipcRenderer.invoke("login:iniciar");
    },

    aoReceber: (callback: (dados: CodigoDeLogin) => void) => {
      const ouvinte = (_e: unknown, dados: CodigoDeLogin) => callback(dados);
      ipcRenderer.on("login:codigo", ouvinte);

      void ipcRenderer
        .invoke("login:pendente")
        .then((dados: CodigoDeLogin | null) => dados && callback(dados));

      return () => ipcRenderer.off("login:codigo", ouvinte);
    },
  },

  links: {
    aoAbrir: (callback: (rota: string) => void) => {
      const ouvinte = (_e: unknown, rota: string) => callback(rota);
      ipcRenderer.on("link:abrir", ouvinte);

      /// O link pode ter chegado antes da tela existir — foi ele que abriu o
      /// app. O main guarda, e a gente busca assim que monta.
      void ipcRenderer
        .invoke("link:pendente")
        .then((rota: string | null) => rota && callback(rota));

      return () => ipcRenderer.off("link:abrir", ouvinte);
    },
  },

  atualizacao: {
    estado: () => ipcRenderer.invoke("atualizacao:estado"),
    procurar: () => ipcRenderer.invoke("atualizacao:procurar"),
    baixar: () => ipcRenderer.invoke("atualizacao:baixar"),
    instalar: () => ipcRenderer.invoke("atualizacao:instalar"),

    aoMudar: (callback: (estado: EstadoDaAtualizacao) => void) => {
      const ouvinte = (_e: unknown, estado: EstadoDaAtualizacao) => callback(estado);
      ipcRenderer.on("atualizacao:mudou", ouvinte);

      return () => ipcRenderer.off("atualizacao:mudou", ouvinte);
    },
  },
};

contextBridge.exposeInMainWorld("gravae", ponte);
