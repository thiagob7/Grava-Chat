import { contextBridge, ipcRenderer } from "electron";
import type {
  CodigoDeLogin,
  EscolhaDeTela,
  EstadoPtt,
  FonteDeTela,
  OpcoesPtt,
  PonteDesktop,
  TipoDeMidia,
} from "@gravae/shared";

/**
 * A ponte entre o app de desktop e o front.
 *
 * O front é o mesmo do navegador: ele checa `window.gravae` e, quando existe,
 * usa o que só o desktop tem (push-to-talk global, seletor de tela com áudio do
 * sistema). Quando não existe, continua exatamente como sempre foi.
 *
 * `contextIsolation` fica ligado e nada de Node atravessa — só as funções
 * declaradas aqui.
 */
const ponte: PonteDesktop = {
  ehDesktop: true as const,
  plataforma: process.platform,
  nomeNoSistema:
    process.argv.find((a) => a.startsWith("--gravae-nome="))?.split("=")[1] ?? "Gravaê",

  ptt: {
    /** Liga/desliga o gancho global e diz o que deu. */
    configurar: (opcoes: OpcoesPtt): Promise<EstadoPtt> =>
      ipcRenderer.invoke("ptt:configurar", opcoes),

    /** Mesma coisa, mas pedindo a permissão do sistema (macOS). */
    pedirPermissao: (opcoes: OpcoesPtt): Promise<EstadoPtt> =>
      ipcRenderer.invoke("ptt:pedir-permissao", opcoes),

    /** Só dispara com a janela FORA de foco; em foco quem manda é o front. */
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

  login: {
    iniciar: () => {
      void ipcRenderer.invoke("login:iniciar");
    },

    aoReceber: (callback: (dados: CodigoDeLogin) => void) => {
      const ouvinte = (_e: unknown, dados: CodigoDeLogin) => callback(dados);
      ipcRenderer.on("login:codigo", ouvinte);

      // o link pode ter ABERTO o app, antes de existir alguém pra ouvir
      void ipcRenderer
        .invoke("login:pendente")
        .then((dados: CodigoDeLogin | null) => dados && callback(dados));

      return () => ipcRenderer.off("login:codigo", ouvinte);
    },
  },
};

contextBridge.exposeInMainWorld("gravae", ponte);
