import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";

import {
  AudioFrame,
  AudioSource,
  LocalAudioTrack,
  Room,
  RoomEvent,
  TrackPublishOptions,
  TrackSource,
} from "@livekit/rtc-node";
import { io } from "socket.io-client";
import yts from "yt-search";

import { instanciaUnica } from "../instancia-unica.mjs";

instanciaUnica("bot-musica");

const TOKEN = process.env.GRAVAE_BOT_TOKEN;
const SERVIDOR = process.env.GRAVAE_URL ?? "http://localhost:3333";
const PAINEL = process.env.GRAVAE_PAINEL ?? "http://localhost:8080";

if (!TOKEN) {
  console.error("Falta o GRAVAE_BOT_TOKEN. Pegue em Configurações → Bots.");
  process.exit(1);
}

const TAXA = 48_000;
const CANAIS = 2;
const AMOSTRAS_POR_QUADRO = TAXA / 50;
const BYTES_POR_QUADRO = AMOSTRAS_POR_QUADRO * CANAIS * 2;

const rodar = promisify(execFile);

async function versaoDe(programa, argumento) {
  const { stdout } = await rodar(programa, [argumento]);
  return stdout.trim().split("\n")[0];
}

async function conferirFerramentas() {
  const faltando = [];

  const ytdlp = await versaoDe("yt-dlp", "--version").catch(() => faltando.push("yt-dlp"));
  await versaoDe("ffmpeg", "-version").catch(() => faltando.push("ffmpeg"));

  if (faltando.length) {
    console.error(`Falta ${faltando.join(" e ")} no PATH. Instale com:`);
    console.error(`  brew install ${faltando.join(" ")}`);
    process.exit(1);
  }

  console.log(`yt-dlp ${ytdlp}`);

  const [ano, mes, dia] = ytdlp.split(".").map(Number);

  if (Number.isInteger(ano) && Number.isInteger(mes) && Number.isInteger(dia)) {
    const dias = Math.floor((Date.now() - Date.UTC(ano, mes - 1, dia)) / 86_400_000);
    if (dias > 60) {
      console.warn(`  ⚠️  já tem ${dias} dias. Se o YouTube der 403: brew upgrade yt-dlp`);
    }
  }
}

await conferirFerramentas();

function diagnosticar(erro) {
  const texto = erro.toLowerCase();

  if (/http error 403|nsig|unable to extract|signature|player response/.test(texto)) {
    return "O YouTube mudou a proteção e o yt-dlp daqui ficou para trás. Atualize com `brew upgrade yt-dlp`.";
  }
  if (/sign in to confirm|confirm your age|age-restricted|not a bot/.test(texto)) {
    return "O YouTube exigiu login para esse vídeo. Tenta outro.";
  }
  if (/private video|video unavailable|has been removed|account associated/.test(texto)) {
    return "Esse vídeo não está disponível.";
  }
  if (/not available in your country|geo restricted|geo-restricted/.test(texto)) {
    return "Esse vídeo é bloqueado por região.";
  }
  return null;
}

const socket = io(SERVIDOR, { transports: ["websocket"], auth: { token: `Bot ${TOKEN}` } });

const PADRAO = {
  prefixo: "!",
  canalDeComandos: "",
  anunciarMusica: true,
  volume: 100,
  filaMaxima: 50,
  boasVindasLigadas: false,
  boasVindasCanal: "",
  boasVindasTexto: "",
};

const cacheDeConfig = new Map();
const CACHE_MS = 15_000;

const guildDoCanal = new Map();
let mapeando = null;

async function mapearCanais() {
  const servidores = await pedirHttp("/bot/servidores").catch(() => []);

  for (const servidor of servidores) {
    const canais = await pedirHttp(`/bot/servidores/${servidor.id}/canais`).catch(() => []);
    for (const canal of canais) guildDoCanal.set(canal.id, servidor.id);
  }
}

async function servidorDe(channelId) {
  if (guildDoCanal.has(channelId)) return guildDoCanal.get(channelId);

  mapeando ??= mapearCanais().finally(() => (mapeando = null));
  await mapeando;

  return guildDoCanal.get(channelId) ?? null;
}

const pedirHttp = async (caminho, { metodo = "GET", corpo } = {}) => {
  const r = await fetch(`${SERVIDOR}/api${caminho}`, {
    method: metodo,
    headers: {
      Authorization: `Bot ${TOKEN}`,
      ...(corpo ? { "Content-Type": "application/json" } : {}),
    },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });

  if (!r.ok) throw new Error(`${metodo} ${caminho} respondeu ${r.status}`);
  return r.status === 204 ? null : r.json();
};

async function configDe(guildId) {
  if (!guildId) return PADRAO;

  const guardado = cacheDeConfig.get(guildId);
  if (guardado && Date.now() - guardado.em < CACHE_MS) return guardado.valor;

  const valor = await fetch(`${PAINEL}/api/config/${guildId}`)
    .then((r) => (r.ok ? r.json() : PADRAO))
    .catch(() => PADRAO);

  cacheDeConfig.set(guildId, { em: Date.now(), valor });
  return valor;
}

const filas = new Map();

const pedir = (evento, dados) =>
  new Promise((ok, falha) =>
    socket.emit(evento, dados, (resposta) =>
      resposta?.ok ? ok(resposta.data) : falha(new Error(resposta?.error ?? "sem resposta")),
    ),
  );

const falar = (channelId, content) =>
  pedirHttp(`/bot/canais/${channelId}/mensagens`, { metodo: "POST", corpo: { content } }).catch(
    (erro) => console.error("[falar]", erro.message),
  );

const doYoutube = (url) => /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//.test(url);

const acessoDo = (url) =>
  doYoutube(url) && COOKIES_YOUTUBE
    ? ["--cookies", COOKIES_YOUTUBE, "--js-runtimes", "node", "-f", "bestaudio/18"]
    : ["-f", "bestaudio"];

let vezDoYtdlp = Promise.resolve();

function umDeCadaVez(tarefa) {
  const vez = vezDoYtdlp.then(tarefa, tarefa);
  vezDoYtdlp = vez.catch(() => undefined);
  return vez;
}

function prepararMusica(musica) {
  if (!doYoutube(musica.url) || musica.direta || musica.preparando) return musica.preparando;

  musica.preparando = umDeCadaVez(() =>
    rodar("nice", ["-n", "15", "yt-dlp", ...acessoDo(musica.url), "-g", "--no-playlist", "--no-warnings", musica.url], {
      timeout: 90_000,
    }),
  )
    .then(({ stdout }) => {
      const direta = stdout.trim().split("\n")[0];
      if (/^https:\/\//.test(direta)) musica.direta = { url: direta, em: Date.now() };
    })
    .catch(() => undefined);

  return musica.preparando;
}

const DIRETA_VALE_MS = 3 * 60 * 60 * 1000;
const SOZINHO_MS = 60_000;

function abrirAudio(musica, aoFalhar) {
  const direta = musica.direta && Date.now() - musica.direta.em < DIRETA_VALE_MS ? musica.direta.url : null;

  const ytdlp = direta
    ? null
    : spawn("yt-dlp", [
      ...acessoDo(musica.url),
      "--no-playlist",
      "--quiet",
      "--no-warnings",
      "-o", "-",
      musica.url,
    ], { detached: true });

  const ffmpeg = spawn("ffmpeg", [
    ...(direta ? ["-reconnect", "1", "-reconnect_streamed", "1", "-reconnect_delay_max", "5", "-i", direta] : ["-i", "pipe:0"]),
    "-loglevel", "error",
    "-vn",
    "-ar", String(TAXA),
    "-ac", String(CANAIS),
    "-f", "s16le",
    "pipe:1",
  ], { detached: true });

  ytdlp?.stdout.pipe(ffmpeg.stdin);

  let reclamacao = "";

  const relatar = (quem) => (dados) => {
    const texto = dados.toString().trim();
    if (!texto) return;

    console.error(`[${quem}]`, texto);
    if (reclamacao.length < 4_000) reclamacao += `${texto}\n`;
  };

  ytdlp?.stderr.on("data", relatar("yt-dlp"));
  ffmpeg.stderr.on("data", relatar("ffmpeg"));

  ytdlp?.on("error", aoFalhar);
  ffmpeg.on("error", aoFalhar);

  ytdlp?.stdin?.on("error", () => undefined);
  ffmpeg.stdin.on("error", () => undefined);

  return {
    direta: Boolean(direta),
    saida: ffmpeg.stdout,
    motivo: () => diagnosticar(reclamacao),
    matar: () => {
      for (const processo of [ytdlp, ffmpeg]) {
        if (!processo) continue;
        try {
          process.kill(-processo.pid, "SIGKILL");
        } catch {
          processo.kill("SIGKILL");
        }
      }
    },
  };
}

const entrando = new Map();

function entrarNaVoz(channelId) {
  if (entrando.has(channelId)) return entrando.get(channelId);

  const pedido = conectarNaVoz(channelId).finally(() => entrando.delete(channelId));
  entrando.set(channelId, pedido);
  return pedido;
}

async function conectarNaVoz(channelId) {
  const jaEsta = filas.get(channelId);

  if (jaEsta?.sala.isConnected) return jaEsta;

  if (jaEsta) {
    largarFila(jaEsta);
    await jaEsta.sala.disconnect().catch(() => undefined);
  }

  const { url, token } = await pedir("voice:token", { channelId });

  const sala = new Room();
  let filaDestaSala = null;

  sala.on(RoomEvent.Disconnected, () => {
    if (!filaDestaSala) return;

    if (filas.get(channelId) !== filaDestaSala) {
      filaDestaSala.parando = true;
      filaDestaSala.audio?.matar();
      return;
    }

    console.log(`saí da chamada de ${channelId} (a conexão caiu ou me desconectaram)`);
    avisarQueCaiu(filaDestaSala);
    largarFila(filaDestaSala);
  });

  await sala.connect(url, token, { autoSubscribe: false, dynacast: true });

  const fonte = new AudioSource(TAXA, CANAIS);
  const track = LocalAudioTrack.createAudioTrack("musica", fonte);

  const opcoes = new TrackPublishOptions();
  opcoes.source = TrackSource.SOURCE_MICROPHONE;
  await sala.localParticipant.publishTrack(track, opcoes);

  await pedir("voice:join", { channelId });

  const fila = {
    channelId,
    sala,
    fonte,
    musicas: [],
    tocando: null,
    audio: null,
    parando: false,
    canalDeAviso: null,
  };
  filaDestaSala = fila;
  filas.set(channelId, fila);

  fila.vigia = setInterval(() => {
    if (fila.parando) return clearInterval(fila.vigia);

    if (sala.remoteParticipants.size > 0) {
      fila.sozinhoDesde = null;
      return;
    }

    fila.sozinhoDesde ??= Date.now();
    if (Date.now() - fila.sozinhoDesde < SOZINHO_MS) return;

    if (fila.canalDeAviso) falar(fila.canalDeAviso, "👋 Fiquei sozinho na chamada, então saí.");
    void sairDaVoz(fila);
  }, 15_000);

  return fila;
}

function avisarQueCaiu(fila) {
  if (!fila.canalDeAviso || !fila.tocando) return;

  const quantas = fila.musicas.length;
  const resto = quantas > 1 ? ` As outras ${quantas - 1} da fila foram junto.` : "";

  falar(fila.canalDeAviso, `🔌 Saí da chamada.${resto} Chame de novo com \`/play\` quando quiser.`);
}

function largarFila(fila) {
  clearInterval(fila.vigia);
  fila.parando = true;
  fila.audio?.matar();
  filas.delete(fila.channelId);
}

async function sairDaVoz(fila) {
  largarFila(fila);

  socket.emit("voice:leave", { channelId: fila.channelId });
  await fila.sala.disconnect().catch(() => undefined);
}

async function tocarProxima(fila, avisarEm) {
  if (fila.parando) return;

  const musica = fila.musicas[0];

  if (!musica) {
    fila.tocando = null;
    if (avisarEm) falar(avisarEm, "Fila vazia. Saindo do canal.");
    await sairDaVoz(fila);
    return;
  }

  fila.tocando = musica;

  if (doYoutube(musica.url) && !musica.direta) {
    if (avisarEm) falar(avisarEm, `⏳ Preparando **${musica.titulo}**…`);
    await prepararMusica(musica);
    if (fila.parando) return;
  }

  if (fila.musicas[1]) void prepararMusica(fila.musicas[1]);

  const audio = abrirAudio(musica, (erro) => console.error("falha ao abrir o áudio:", erro));
  fila.audio = audio;

  let sobra = Buffer.alloc(0);
  let proximoQuadro = Date.now();
  let veioAlgo = false;

  for await (const pedaco of audio.saida) {
    if (fila.parando) return;

    if (!veioAlgo) {
      veioAlgo = true;
      proximoQuadro = Date.now();
      if (avisarEm) falar(avisarEm, `▶️ Tocando **${musica.titulo}** (${musica.duracao})\n${musica.url}`);
    }

    sobra = Buffer.concat([sobra, pedaco]);

    while (sobra.length >= BYTES_POR_QUADRO) {
      const quadro = sobra.subarray(0, BYTES_POR_QUADRO);
      sobra = sobra.subarray(BYTES_POR_QUADRO);

      const amostras = new Int16Array(
        quadro.buffer.slice(quadro.byteOffset, quadro.byteOffset + quadro.byteLength),
      );

      await fila.fonte.captureFrame(new AudioFrame(amostras, TAXA, CANAIS, AMOSTRAS_POR_QUADRO));

      proximoQuadro += 20;
      const esperar = proximoQuadro - Date.now();
      if (esperar > 0) await new Promise((r) => setTimeout(r, esperar));
    }
  }

  if (fila.parando) return;

  audio.matar();

  if (!veioAlgo && audio.direta && !fila.parando && !musica.repreparada) {
    musica.repreparada = true;
    musica.direta = null;
    musica.preparando = null;
    return tocarProxima(fila, null);
  }

  if (!veioAlgo && !musica.reserva && /youtu\.?be/.test(musica.url)) {
    const reserva = await procurarNoSoundcloud(musica.titulo).catch(() => null);

    if (reserva && !fila.parando) {
      if (avisarEm) falar(avisarEm, `O YouTube não deixou tocar agora; peguei **${reserva.title}** do SoundCloud.`);
      fila.musicas[0] = { titulo: reserva.title, url: reserva.url, duracao: reserva.timestamp, reserva: true };
      return tocarProxima(fila, null);
    }
  }

  if (!veioAlgo && avisarEm) {
    const motivo = audio.motivo() ?? "O log do bot tem o motivo.";
    falar(avisarEm, `Não consegui tocar **${musica.titulo}**. ${motivo}`);
  }

  fila.musicas.shift();
  return tocarProxima(fila, avisarEm);
}

const FONTE = process.env.GRAVAE_FONTE ?? "youtube";
const COOKIES_YOUTUBE = process.env.GRAVAE_YOUTUBE_COOKIES ?? null;
const PREVIA_SEGUNDOS = 31;

async function procurar(busca) {
  const link = /^https?:\/\//.test(busca);

  if (link) return { title: busca, url: busca, timestamp: null };

  if (FONTE !== "soundcloud") {
    const resultado = await yts(busca).catch(() => null);
    const video = resultado?.videos?.[0];
    if (video) return video;
  }

  return procurarNoSoundcloud(busca);
}

async function procurarNoSoundcloud(busca) {
  const achado = await umDeCadaVez(() =>
    rodar("yt-dlp", [
      "scsearch8:" + busca,
      "--flat-playlist",
      "--print", "%(duration)s\t%(webpage_url)s\t%(title)s",
      "--no-warnings",
    ]),
  ).catch(() => null);

  if (!achado) return null;

  const musicas = achado.stdout
    .trim()
    .split("\n")
    .map((linha) => {
      const [duracao, url, ...titulo] = linha.split("\t");
      return { segundos: Number(duracao), url, title: titulo.join("\t") };
    })
    .filter((m) => m.url?.startsWith("https://soundcloud.com/") && m.title);

  const inteira = musicas.find((m) => m.segundos > PREVIA_SEGUNDOS) ?? null;
  if (!inteira) return null;

  const minutos = Math.floor(inteira.segundos / 60);
  const segundos = String(Math.floor(inteira.segundos % 60)).padStart(2, "0");
  return { title: inteira.title, url: inteira.url, timestamp: `${minutos}:${segundos}` };
}

async function comandoPlay(mensagem, busca, config) {
  const { channelId: canalDeVoz } = await pedir("voice:onde", { userId: mensagem.author.id });

  if (!canalDeVoz) {
    return falar(mensagem.channelId, "Entra num canal de voz primeiro que eu te acompanho.");
  }

  const video = await procurar(busca);

  if (!video) return falar(mensagem.channelId, `Não achei nada para **${busca}**.`);

  const fila = await entrarNaVoz(canalDeVoz);

  if (fila.musicas.length >= config.filaMaxima) {
    return falar(mensagem.channelId, `A fila está cheia (${config.filaMaxima}). Espere esvaziar.`);
  }

  fila.canalDeAviso = mensagem.channelId;

  const musica = { titulo: video.title, url: video.url, duracao: video.timestamp };
  fila.musicas.push(musica);

  const avisarEm = config.anunciarMusica ? mensagem.channelId : null;

  if (fila.tocando) {
    if (fila.musicas[1] === musica) void prepararMusica(musica);

    falar(
      mensagem.channelId,
      `➕ **${musica.titulo}** entrou na fila (posição ${fila.musicas.length - 1}).\n${musica.url}`,
    );
  } else {
    void tocarProxima(fila, avisarEm);
  }
}

socket.on("member:joined", async (membro) => {
  const config = await configDe(membro?.guildId);

  if (!config.boasVindasLigadas || !config.boasVindasCanal) return;

  const usuario = membro.user ?? membro;

  const texto = (config.boasVindasTexto || "Bem-vindo, {pessoa}!")
    .replaceAll("{pessoa}", `<@${usuario.id}>`)
    .replaceAll("{nome}", usuario.displayName ?? "alguém")
    .replaceAll("{prefixo}", config.prefixo);

  falar(config.boasVindasCanal, texto);
});

function filaDoAutor(mensagem) {
  return [...filas.values()][0] ?? null;
}

const COMANDOS = [
  {
    name: "play",
    description: "Toca uma música do YouTube",
    options: [
      { name: "busca", description: "Nome da música ou link", kind: "texto", required: true },
    ],
  },
  { name: "skip", description: "Pula a música atual" },
  { name: "stop", description: "Para tudo e sai do canal de voz" },
  { name: "fila", description: "Mostra o que vem por aí" },
];

async function executar(de, comando, argumento, config) {
  try {
    if (comando === "play") {
      if (!argumento) return falar(de.channelId, "Diz o que você quer ouvir.");
      return await comandoPlay(de, argumento, config);
    }

    if (comando === "skip") {
      const fila = filaDoAutor(de);
      if (!fila?.tocando) return falar(de.channelId, "Não tem nada tocando.");

      falar(de.channelId, `⏭️ Pulando **${fila.tocando.titulo}**.`);
      fila.audio?.matar();
      return;
    }

    if (comando === "stop") {
      const fila = filaDoAutor(de);
      if (!fila) return falar(de.channelId, "Não estou tocando nada.");

      falar(de.channelId, "⏹️ Parei e saí do canal.");
      return await sairDaVoz(fila);
    }

    if (comando === "fila") {
      const fila = filaDoAutor(de);
      if (!fila?.musicas.length) return falar(de.channelId, "A fila está vazia.");

      const lista = fila.musicas
        .map((m, i) => (i === 0 ? `▶️ ${m.titulo}` : `${i}. ${m.titulo}`))
        .join("\n");

      return falar(de.channelId, lista);
    }
  } catch (erro) {
    console.error(erro);
    falar(de.channelId, `Deu ruim: ${erro.message}`);
  }
}

socket.on("connect", async () => {
  console.log(`no ar. Configuração vem de ${PAINEL}`);
  await mapearCanais().catch(() => undefined);

  await pedirHttp("/bot/comandos", { metodo: "PUT", corpo: { commands: COMANDOS } })
    .then(() => console.log(`${COMANDOS.length} comandos de barra registrados`))
    .catch((erro) => console.error("[comandos]", erro.message));
});
socket.on("connect_error", (e) => console.error("não entrou:", e.message));

socket.on("voice:move", async ({ channelId, fromChannelId }) => {
  const afetadas = [...filas.values()].filter((fila) => !fromChannelId || fila.channelId === fromChannelId);

  for (const fila of afetadas) {
    avisarQueCaiu(fila);
    largarFila(fila);
    await fila.sala.disconnect().catch(() => undefined);
  }

  console.log(channelId ? `me moveram para ${channelId}` : "me desconectaram da chamada");
});

socket.on("command:invoked", async ({ channelId, command, options, user }) => {
  const config = await configDe(await servidorDe(channelId));

  if (config.canalDeComandos && config.canalDeComandos !== channelId) {
    return falar(channelId, `Meus comandos são no <#${config.canalDeComandos}>.`);
  }

  await executar({ channelId, author: user }, command, options.busca ?? "", config);
});

socket.on("message:created", async (mensagem) => {
  if (mensagem.author.isBot) return;

  const config = await configDe(await servidorDe(mensagem.channelId));

  if (config.canalDeComandos && config.canalDeComandos !== mensagem.channelId) return;

  const texto = (mensagem.content ?? "").trim();
  const [bruto, ...resto] = texto.split(/\s+/);
  const argumento = resto.join(" ");

  if (!bruto?.startsWith(config.prefixo)) return;

  await executar(mensagem, bruto.slice(config.prefixo.length), argumento, config);
});
