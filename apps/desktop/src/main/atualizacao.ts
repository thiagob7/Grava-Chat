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

  async function instalar() {
    if (!preparado || estado.fase !== "pronta") return;

    if (process.platform === "darwin") {
      const pacote = pacoteInstalado();
      if (!pacote) return;

      const roteiro = await escreverTroca(pacote, preparado);
      spawn("/bin/sh", [roteiro], { detached: true, stdio: "ignore" }).unref();
    } else {
      /// O instalador do Windows sabe se virar sozinho: `/S` é o modo calado do
      /// NSIS, e ele reabre o app no fim.
      spawn(preparado, ["/S"], { detached: true, stdio: "ignore" }).unref();
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
      const rodada = () =>
        void procurar().then((atual) => (atual.disponivel ? baixar() : undefined));

      const primeira = setTimeout(rodada, ATRASO_INICIAL_MS);
      const relogio = setInterval(rodada, INTERVALO_MS);

      primeira.unref();
      relogio.unref();
      timers.push(primeira, relogio);

      return () => timers.forEach((t) => clearTimeout(t));
    },
  };
}
