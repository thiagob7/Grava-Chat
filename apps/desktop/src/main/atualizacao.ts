import { app, BrowserWindow } from "electron";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { EstadoDaAtualizacao } from "@gravae/shared";

import { escreverTroca, prepararNoMac } from "./atualizacao-mac.js";
import { ehDev } from "./config.js";
import { ehMaisNova } from "./versao.js";

const REPO = "thiagob7/Grava-Chat";
const ARQUIVO = process.platform === "darwin" ? "gravae-chat-mac.dmg" : "gravae-chat-win.exe";

/*
  De quanto em quanto tempo perguntar se saiu versão nova.

  Uma vez na abertura resolve quase tudo — ninguém deixa o app aberto por
  semanas de propósito. As seis horas são pra quem deixa: sem elas, a máquina
  que nunca reinicia seria justamente a que nunca atualiza.
*/
const INTERVALO_MS = 6 * 60 * 60 * 1000;

/// Espera antes da primeira checagem: a abertura já tem o que fazer, e uma
/// atualização que chega dez segundos depois não perde nada.
const ATRASO_INICIAL_MS = 10_000;

/*
  Intervalo mínimo entre duas perguntas feitas por foco.

  Voltar pro app é o gesto de quem quer estar em dia, e por isso vale perguntar
  ali — mas alt-tab é um gesto que se repete dezenas de vezes por hora, e sem
  esta trava cada ida e volta viraria uma consulta à API do GitHub. Quinze
  minutos é curto o bastante pra parecer instantâneo e longo o bastante pra não
  virar enxurrada.
*/
const INTERVALO_POR_FOCO_MS = 15 * 60 * 1000;


/*
  Onde o aplicativo está instalado.

  `getPath("exe")` aponta pro binário lá dentro
  (`…/Gravae Chat.app/Contents/MacOS/Gravae Chat`); o que a gente troca é o
  pacote inteiro, três níveis acima. Fora do macOS não há pacote nenhum.
*/
function pacoteInstalado(): string | null {
  if (process.platform !== "darwin") return null;

  const executavel = app.getPath("exe");
  const pacote = path.resolve(executavel, "..", "..", "..");

  return pacote.endsWith(".app") ? pacote : null;
}

/*
  Solta o processo que vai trocar o app e só devolve quando o sistema confirma
  que ele nasceu.

  `spawn` não avisa na hora: se o programa não existe ou não pode rodar, o erro
  chega depois, num evento. Antes disso a gente matava as janelas e saía do app
  na sequência do `spawn`, então uma falha aqui virava exatamente o pior caso —
  app fechado, versão não trocada e ninguém pra contar o que houve.
*/
function disparar(programa: string, argumentos: string[]): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(programa, argumentos, { detached: true, stdio: "ignore" });

    /// Solto do nosso processo: ele precisa continuar vivo depois que o app morre.
    processo.once("spawn", () => {
      processo.unref();
      resolver();
    });

    processo.once("error", rejeitar);
  });
}

interface Publicada {
  versao: string;
  url: string;
  tamanho: number;
}

async function ultimaPublicada(): Promise<Publicada> {
  const resposta = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { Accept: "application/vnd.github+json" },
  });

  if (!resposta.ok) throw new Error(`GitHub respondeu ${resposta.status}`);

  const dados = (await resposta.json()) as {
    tag_name?: string;
    assets?: { name: string; browser_download_url: string; size: number }[];
  };

  const arquivo = dados.assets?.find((a) => a.name === ARQUIVO);
  if (!dados.tag_name || !arquivo) throw new Error("A release não tem o arquivo desta plataforma.");

  return {
    versao: dados.tag_name.replace(/^v/, ""),
    url: arquivo.browser_download_url,
    tamanho: arquivo.size,
  };
}

export function criarAtualizador(aoMudar: (estado: EstadoDaAtualizacao) => void) {
  let estado: EstadoDaAtualizacao = {
    atual: app.getVersion(),
    disponivel: null,
    fase: "ociosa",
    progresso: 0,
    erro: null,
  };

  /// Onde o app novo fica esperando a hora de entrar. `null` até estar pronto.
  let preparado: string | null = null;
  let trabalhando = false;

  const mudar = (patch: Partial<EstadoDaAtualizacao>) => {
    estado = { ...estado, ...patch };
    aoMudar(estado);
  };

  async function procurar(): Promise<EstadoDaAtualizacao> {
    /*
      Em desenvolvimento não existe app instalado pra trocar — o que roda é o
      Electron genérico do `node_modules`. Sem esta trava, mandar atualizar aqui
      apagaria a instalação do próprio Electron do repositório.
    */
    if (ehDev || !app.isPackaged) return estado;
    if (trabalhando || estado.fase === "pronta") return estado;

    trabalhando = true;
    mudar({ fase: "procurando", erro: null });

    try {
      const publicada = await ultimaPublicada();
      const nova = ehMaisNova(publicada.versao, estado.atual);

      mudar({ fase: "ociosa", disponivel: nova ? publicada.versao : null });
      return estado;
    } catch (erro) {
      mudar({ fase: "erro", erro: erro instanceof Error ? erro.message : String(erro) });
      return estado;
    } finally {
      trabalhando = false;
    }
  }

  async function baixar(): Promise<EstadoDaAtualizacao> {
    if (ehDev || !app.isPackaged || trabalhando || estado.fase === "pronta") return estado;
    if (!estado.disponivel) return estado;

    trabalhando = true;
    mudar({ fase: "baixando", progresso: 0, erro: null });

    const pasta = await mkdtemp(path.join(tmpdir(), "gravae-atualizacao-"));

    try {
      const publicada = await ultimaPublicada();
      const destino = path.join(pasta, ARQUIVO);

      const resposta = await fetch(publicada.url);
      if (!resposta.ok || !resposta.body) throw new Error(`Download respondeu ${resposta.status}`);

      /*
        O progresso vem do total anunciado pela release, e não do cabeçalho da
        resposta: o GitHub redireciona pra uma CDN e nem sempre manda
        `content-length`. Sem número, a faixa fica com uma barra parada e a
        pessoa acha que travou.
      */
      let baixado = 0;
      const contando = new TransformStream<Uint8Array, Uint8Array>({
        transform(pedaco, controle) {
          baixado += pedaco.byteLength;
          mudar({ progresso: Math.min(baixado / publicada.tamanho, 1) });
          controle.enqueue(pedaco);
        },
      });

      await pipeline(
        Readable.fromWeb(resposta.body.pipeThrough(contando) as never),
        createWriteStream(destino),
      );

      preparado =
        process.platform === "darwin" ? await prepararNoMac(destino, publicada.versao) : destino;

      mudar({ fase: "pronta", progresso: 1 });
      return estado;
    } catch (erro) {
      await rm(pasta, { recursive: true, force: true }).catch(() => undefined);
      mudar({ fase: "erro", erro: erro instanceof Error ? erro.message : String(erro) });
      return estado;
    } finally {
      trabalhando = false;
    }
  }

  /*
    Instalar é o único passo sem volta, e era o único que não dizia nada.

    Ele saía calado por três motivos diferentes — fase que não era "pronta",
    `.app` não encontrado, roteiro de troca falhando — e em todos eles o clique
    parecia não ter acontecido. Agora cada saída tem mensagem, e a falha que
    ocorre ANTES da troca começar devolve a fase pra "pronta": o app baixado
    continua no disco, então tentar de novo é a coisa certa a oferecer.
  */
  async function instalar() {
    /// Clique repetido enquanto o processo de fora nasce não recomeça nada.
    if (estado.fase === "instalando") return;

    if (!preparado || estado.fase !== "pronta") {
      mudar({ fase: "erro", erro: "Não há versão preparada para instalar. Baixe de novo." });
      return;
    }

    mudar({ fase: "instalando", erro: null });

    try {
      if (process.platform === "darwin") {
        const pacote = pacoteInstalado();

        /*
          Sem pacote não há o que trocar. Acontece de verdade: app rodando de
          dentro do .dmg, ou movido pra um lugar onde o caminho do executável
          não termina em `.app`.
        */
        if (!pacote) {
          throw new Error(
            "Não achei o Gravaê Chat.app no disco. Se você abriu o app de dentro do instalador, arraste-o para a pasta Aplicativos primeiro.",
          );
        }

        const roteiro = await escreverTroca(pacote, preparado);
        await disparar("/bin/sh", [roteiro]);
      } else {
        /// O instalador do Windows sabe se virar sozinho: `/S` é o modo calado do
        /// NSIS, e ele reabre o app no fim.
        await disparar(preparado, ["/S"]);
      }
    } catch (erro) {
      mudar({
        fase: "pronta",
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      return;
    }

    /// Sair de verdade, e não esconder: o roteiro espera o processo morrer pra
    /// poder mexer no pacote, e janela viva no macOS segura o app de pé.
    for (const janela of BrowserWindow.getAllWindows()) janela.destroy();
    app.quit();
  }

  const timers: NodeJS.Timeout[] = [];

  return {
    estado: () => estado,
    procurar,
    baixar,
    instalar,

    /*
      Procura e JÁ BAIXA sozinho. É o que faz a atualização parecer instantânea
      pra quem clica: quando a faixa aparece dizendo "reiniciar", o arquivo já
      está no disco, conferido e sem quarentena.
    */
    vigiar() {
      let ultima = 0;

      const rodada = () => {
        ultima = Date.now();
        void procurar().then((atual) => (atual.disponivel ? baixar() : undefined));
      };

      const primeira = setTimeout(rodada, ATRASO_INICIAL_MS);
      const relogio = setInterval(rodada, INTERVALO_MS);

      primeira.unref();
      relogio.unref();
      timers.push(primeira, relogio);

      /*
        E também ao VOLTAR pro aplicativo.

        Sem isto existe um beco: quem já estava com o app aberto quando a versão
        saiu fica até seis horas sem descobrir, e não há nada que possa apertar
        para perguntar antes. Voltar pra janela é justamente o momento em que a
        pessoa está olhando — e é onde o aviso vale alguma coisa.

        A trava de quinze minutos é o que separa isto de um gatilho por alt-tab.
      */
      const aoFocar = () => {
        if (Date.now() - ultima < INTERVALO_POR_FOCO_MS) return;
        rodada();
      };

      app.on("browser-window-focus", aoFocar);

      return () => {
        timers.forEach((t) => clearTimeout(t));
        app.off("browser-window-focus", aoFocar);
      };
    },
  };
}
