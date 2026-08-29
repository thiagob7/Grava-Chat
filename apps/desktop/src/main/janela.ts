import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, ehDev } from "./config.js";

function paginaDeEspera(motivo: string) {
  return `data:text/html,${encodeURIComponent(
    `<body style="background:#2b2d31;color:#f2f3f5;font:15px -apple-system,sans-serif;display:grid;place-items:center;height:100vh;margin:0">
       <div style="text-align:center;max-width:32rem">
         <p>${motivo}</p>
         <p style="color:#b5bac1">Tentando de novo sozinho…</p>
       </div>
     </body>`,
  )}`;
}

async function carregarComEspera(janela: BrowserWindow, tentativas = 40) {
  /*
    O app é uma janela carregando o site, então atualizar o site atualiza o app
    — mas só se ele não servir a versão velha do próprio cache. Foi o que
    aconteceu: publicamos, e a janela continuou mostrando o build anterior.

    Limpar o cache HTTP na abertura resolve de vez. Custa alguns megabytes
    baixados de novo a cada início, o que é nada perto de alguém jurando que a
    correção não subiu.
  */
  await janela.webContents.session.clearCache().catch(() => undefined);

  for (let i = 0; i < tentativas; i++) {
    try {
      await janela.loadURL(APP_URL);
      return;
    } catch {
      if (janela.isDestroyed()) return;
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  await janela.loadURL(
    paginaDeEspera(`Não consegui falar com o Gravaê em <b>${APP_URL}</b>.`),
  );
}

const ICONE = path.join(__dirname, "..", "build", "icon.png");

export function criarJanela() {
  const janela = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 940,
    minHeight: 560,
    backgroundColor: "#2b2d31",
    show: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    ...(process.platform === "darwin" ? {} : { icon: ICONE }),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      additionalArguments: [`--gravae-nome=${ehDev ? "Electron" : app.name}`],
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  janela.once("ready-to-show", () => janela.show());

  /*
    A janela acompanha o fullscreen da PÁGINA.

    No macOS com `titleBarStyle: "hiddenInset"`, o Electron nem sempre
    redimensiona a janela quando o conteúdo pede tela cheia: o documento entra
    em fullscreen, a janela fica do mesmo tamanho, e pra quem clicou o botão
    simplesmente não fez nada. Ligar os dois eventos resolve — e o Esc, que o
    navegador trata sozinho, dispara o `leave` e devolve a janela.
  */
  janela.webContents.on("enter-html-full-screen", () => janela.setFullScreen(true));
  janela.webContents.on("leave-html-full-screen", () => janela.setFullScreen(false));

  janela.webContents.on("did-finish-load", () => console.log(`[desktop] carregou ${APP_URL}`));

  if (ehDev) {
    janela.webContents.on("console-message", (evento) => {
      if (evento.level === "info" || evento.level === "debug") return;
      console.log(`[front:${evento.level}] ${evento.message}`);
    });
  }
  /*
    Navegação que falha DEPOIS da abertura deixava a janela preta e vazia.

    A espera com tentativas só corre uma vez, na subida. Se a página recarrega
    mais tarde — uma publicação nova, o Wi-Fi caindo, a máquina voltando do
    sono — e essa carga falha, o Electron não desenha nada: nem erro, nem
    botão, nem menu. A janela fica um retângulo escuro, e a única saída é
    fechar o app pelo teclado. Foi o que aconteceu no deploy de 29/08.

    Aqui a falha vira uma página que explica o que houve e volta a tentar
    sozinha, do mesmo jeito que a subida faz.
  */
  let tentandoDeNovo: NodeJS.Timeout | null = null;

  janela.webContents.on("did-fail-load", (_e, code, descricao, urlQueFalhou, ehPrincipal) => {
    console.error(`[desktop] falhou ao carregar ${urlQueFalhou}: ${descricao} (${code})`);

    /// `-3` é navegação abortada pelo próprio app (um redirecionamento nosso,
    /// por exemplo), e quadro secundário é iframe: nenhum dos dois deixa a
    /// janela vazia, e recarregar por causa deles seria um laço.
    if (!ehPrincipal || code === -3 || janela.isDestroyed()) return;

    void janela.loadURL(paginaDeEspera("Perdi a conexão com o Gravaê."));

    if (tentandoDeNovo) clearTimeout(tentandoDeNovo);
    tentandoDeNovo = setTimeout(() => {
      if (!janela.isDestroyed()) void janela.loadURL(APP_URL).catch(() => undefined);
    }, 3_000);
  });

  janela.on("closed", () => {
    if (tentandoDeNovo) clearTimeout(tentandoDeNovo);
  });

  janela.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) void shell.openExternal(url);
    return { action: "deny" };
  });

  janela.webContents.on("will-navigate", (evento, url) => {
    if (new URL(url).origin === APP_ORIGIN) return;
    evento.preventDefault();
    void shell.openExternal(url);
  });

  /*
    ⚠️ Permissão que falta aqui NÃO vira erro na página: o pedido simplesmente
    morre, sem evento e sem exceção. Foi o que fez o botão de tela cheia da live
    parecer quebrado por dois dias — o `requestFullscreen()` do navegador ficava
    pendente pra sempre, então nem o nosso `catch` com aviso na tela disparava.

    Por isso o `console.warn` na negativa: da próxima vez que um botão não fizer
    nada no aplicativo, o motivo está no terminal em vez de em lugar nenhum.
  */
  const PERMITIDAS = [
    "media", // microfone e câmera na chamada
    "display-capture", // compartilhar a tela
    "clipboard-read", // colar imagem na conversa
    "notifications", // aviso de mensagem nova
    "fullscreen", // o vídeo da live ocupando o monitor
  ];

  janela.webContents.session.setPermissionRequestHandler((_wc, permissao, permitir) => {
    const liberada = PERMITIDAS.includes(permissao);
    if (!liberada) console.warn(`[desktop] permissão negada: ${permissao}`);

    permitir(liberada);
  });

  void carregarComEspera(janela);

  if (ehDev && !app.isPackaged) janela.webContents.openDevTools({ mode: "detach" });

  return janela;
}
