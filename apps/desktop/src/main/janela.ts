import { app, BrowserWindow, shell } from "electron";
import path from "node:path";

import { APP_ORIGIN, APP_URL, ehDev } from "./config.js";

/*
  A marca, desenhada aqui dentro.

  Esta tela aparece justamente quando o site NÃO carrega, então ela não pode
  buscar nada: imagem de arquivo, fonte da web ou folha externa chegariam
  quebradas. O "G" é o mesmo de `apps/web/public/brand`, colado como SVG no
  meio do HTML.
*/
const MARCA = `<svg width="54" height="80" viewBox="0 0 538 802" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 657.14L358.358 614.064V610.397L402.349 249.29L228.212 284.118L208.965 391.352L283.203 378.519L269.455 485.753L151.225 499.499L198.883 132.895L432.595 116.398L443.592 0L89.8185 44.9095L0 657.14Z" fill="white"/><path d="M461.458 801.261C503.731 801.261 538 766.992 538 724.72C538 682.447 503.731 648.178 461.458 648.178C419.185 648.178 384.916 682.447 384.916 724.72C384.916 766.992 419.185 801.261 461.458 801.261Z" fill="#FF0000"/></svg>`;

/*
  A tela de "sem conexão" do aplicativo.

  Ela já existia e quase nunca aparecia: era carregada só DEPOIS de quarenta
  tentativas falharem — uns vinte segundos com a janela simplesmente branca,
  que foi o que apareceu quando a internet caiu. Agora ela entra ANTES da
  primeira tentativa, e o site a substitui quando conseguir carregar.

  O botão é um link pro próprio endereço do app, e não um pedido ao processo
  principal: sem IPC, a página funciona sozinha, e clicar nele é uma navegação
  de verdade — falhando de novo, cai no mesmo `did-fail-load` que trouxe você
  até aqui.
*/
function paginaDeEspera(motivo: string) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    `<!doctype html><meta charset="utf-8">
     <body style="background:#121214;color:#e1e1e6;font:14px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:grid;place-items:center;height:100vh;margin:0;-webkit-user-select:none">
       <div style="text-align:center;max-width:22rem;padding:0 24px">
         <div style="animation:respirar 2s ease-in-out infinite">${MARCA}</div>
         <h1 style="margin:28px 0 8px;font-size:17px;font-weight:600">${motivo}</h1>
         <p style="margin:0;color:#a8a8b3">Isto volta sozinho assim que a conexão voltar — não precisa fechar o app.</p>
         <a href="${APP_URL}" style="display:inline-block;margin-top:22px;padding:9px 18px;border-radius:8px;background:#d30404;color:#fff;text-decoration:none;font-weight:600">Tentar agora</a>
       </div>
       <style>@keyframes respirar{0%,100%{opacity:1}50%{opacity:.45}}</style>
     </body>`,
  )}`;
}

/*
  Uma rotina só de carregar, usada na subida e em toda falha depois.

  Antes eram duas, e elas brigavam: a da subida repetia quarenta vezes em laço,
  e o `did-fail-load` agendava outra tentativa a cada falha — duas cargas
  disputando a mesma janela, cada uma desfazendo o que a outra ia mostrar.

  A espera entre tentativas cresce até dez segundos. Insistir de meio em meio
  segundo por horas, quando alguém deixa o app aberto com a internet caída, é
  gastar bateria pra nada.
*/
function criarCarregador(janela: BrowserWindow) {
  let tentativas = 0;
  let relogio: NodeJS.Timeout | null = null;

  const carregar = async () => {
    if (janela.isDestroyed()) return;

    try {
      await janela.loadURL(APP_URL);
      tentativas = 0;
    } catch {
      /// O `did-fail-load` cuida de mostrar a espera e reagendar; aqui só não
      /// deixamos a promessa rejeitada subir sem dono.
    }
  };

  const agendar = () => {
    if (relogio) clearTimeout(relogio);

    tentativas += 1;
    const espera = Math.min(500 * 2 ** Math.min(tentativas, 5), 10_000);
    relogio = setTimeout(() => void carregar(), espera);
  };

  const encerrar = () => {
    if (relogio) clearTimeout(relogio);
    relogio = null;
  };

  return { carregar, agendar, encerrar };
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
  const carregador = criarCarregador(janela);

  janela.webContents.on("did-fail-load", (_e, code, descricao, urlQueFalhou, ehPrincipal) => {
    console.error(`[desktop] falhou ao carregar ${urlQueFalhou}: ${descricao} (${code})`);

    /// `-3` é navegação abortada pelo próprio app (um redirecionamento nosso,
    /// por exemplo), e quadro secundário é iframe: nenhum dos dois deixa a
    /// janela vazia, e recarregar por causa deles seria um laço.
    if (!ehPrincipal || code === -3 || janela.isDestroyed()) return;

    void janela.loadURL(paginaDeEspera("Sem conexão com o Gravaê"));
    carregador.agendar();
  });

  janela.on("closed", () => carregador.encerrar());

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
    Permissão: quem manda é a ORIGEM, não uma lista de nomes.

    A lista de antes (`media`, `display-capture`, …) parecia prudente e era uma
    armadilha: faltou `fullscreen` nela e o botão de tela cheia ficou morto por
    duas versões — permissão negada aqui NÃO vira erro na página, o pedido do
    navegador fica pendente pra sempre, sem evento e sem exceção. Cada permissão
    nova que o site passasse a usar seria outro botão quebrado, e outro
    instalador pra todo mundo baixar.

    Esta janela só exibe uma origem: o `will-navigate` manda qualquer outra pro
    navegador do sistema, e o `setWindowOpenHandler` recusa abrir janela. Então
    "veio do nosso site" é a mesma garantia que a lista tentava dar — e não
    envelhece. O que vier de qualquer outro lugar continua negado, e agora
    aparece no terminal em vez de sumir.
  */
  janela.webContents.session.setPermissionRequestHandler((quem, permissao, permitir, detalhes) => {
    const origem = (() => {
      try {
        return new URL(detalhes?.requestingUrl || quem?.getURL() || "").origin;
      } catch {
        return null;
      }
    })();

    const nossa = origem === APP_ORIGIN;
    if (!nossa) {
      console.warn(`[desktop] permissão "${permissao}" negada para ${origem ?? "origem desconhecida"}`);
    }

    permitir(nossa);
  });

  /*
    A espera entra PRIMEIRO, e o site a substitui quando carregar.

    Assim a janela nunca aparece vazia: mesmo com a internet fora desde o
    começo, quem abre o app vê a marca e uma frase, em vez de um retângulo
    escuro por vinte segundos.

    O cache HTTP é limpo antes: o app é uma janela carregando o site, então
    atualizar o site atualiza o app — mas só se ele não servir a versão velha
    do próprio cache. Já aconteceu de publicarmos e a janela seguir mostrando o
    build anterior.
  */
  void janela.loadURL(paginaDeEspera("Abrindo o Gravaê…")).then(async () => {
    await janela.webContents.session.clearCache().catch(() => undefined);
    await carregador.carregar();
  });

  if (ehDev && !app.isPackaged) janela.webContents.openDevTools({ mode: "detach" });

  return janela;
}
