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

const INTERVALO_MS = 6 * 60 * 60 * 1000;

const ATRASO_INICIAL_MS = 10_000;

const INTERVALO_POR_FOCO_MS = 15 * 60 * 1000;

function pacoteInstalado(): string | null {
  if (process.platform !== "darwin") return null;

  const executavel = app.getPath("exe");
  const pacote = path.resolve(executavel, "..", "..", "..");

  return pacote.endsWith(".app") ? pacote : null;
}

function disparar(programa: string, argumentos: string[]): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    const processo = spawn(programa, argumentos, { detached: true, stdio: "ignore" });

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

  let preparado: string | null = null;
  let trabalhando = false;

  const mudar = (patch: Partial<EstadoDaAtualizacao>) => {
    estado = { ...estado, ...patch };
    aoMudar(estado);
  };

  async function procurar(): Promise<EstadoDaAtualizacao> {
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
    if (estado.fase === "instalando") return;

    if (!preparado || estado.fase !== "pronta") {
      mudar({ fase: "erro", erro: "Não há versão preparada para instalar. Baixe de novo." });
      return;
    }

    mudar({ fase: "instalando", erro: null });

    try {
      if (process.platform === "darwin") {
        const pacote = pacoteInstalado();

        if (!pacote) {
          throw new Error(
            "Não achei o Gravaê Chat.app no disco. Se você abriu o app de dentro do instalador, arraste-o para a pasta Aplicativos primeiro.",
          );
        }

        const roteiro = await escreverTroca(pacote, preparado);
        await disparar("/bin/sh", [roteiro]);
      } else {
        await disparar(preparado, ["/S"]);
      }
    } catch (erro) {
      mudar({
        fase: "pronta",
        erro: erro instanceof Error ? erro.message : String(erro),
      });
      return;
    }

    for (const janela of BrowserWindow.getAllWindows()) janela.destroy();
    app.quit();
  }

  const timers: NodeJS.Timeout[] = [];

  return {
    estado: () => estado,
    procurar,
    baixar,
    instalar,

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
