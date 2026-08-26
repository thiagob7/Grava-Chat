/**
 * Bot de música do Gravaê.
 *
 * Roda fora do app, como qualquer bot daqui: conecta ao gateway com o token,
 * ouve os comandos no chat e toca no canal de voz.
 *
 *   GRAVAE_BOT_TOKEN=<token> node bot.mjs
 *
 * Comandos: !play <busca ou link>, !skip, !stop, !fila
 *
 * Precisa de `yt-dlp` e `ffmpeg` no PATH (brew install yt-dlp ffmpeg).
 */
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

/// Antes de qualquer coisa: um bot de música só. Dois tocam a mesma
/// música em cima da outra no mesmo canal de voz.
instanciaUnica("bot-musica");

const TOKEN = process.env.GRAVAE_BOT_TOKEN;
const SERVIDOR = process.env.GRAVAE_URL ?? "http://localhost:3333";
/// O painel do dev. É de lá que vêm prefixo, volume, canal e boas-vindas —
/// nada disso mora no Gravaê, e é justamente esse o ponto.
const PAINEL = process.env.GRAVAE_PAINEL ?? "http://localhost:8080";

if (!TOKEN) {
  console.error("Falta o GRAVAE_BOT_TOKEN. Pegue em Configurações → Bots.");
  process.exit(1);
}

/*
  O SFU quer PCM cru: 48 kHz, dois canais, inteiros de 16 bits com sinal. É
  para isso que o ffmpeg converte, e é isso que o AudioSource espera receber.

  O quadro de 20 ms é a medida do WebRTC. Mandar pedaços maiores engasga o
  áudio do outro lado; menores, gastam CPU à toa.
*/
const TAXA = 48_000;
const CANAIS = 2;
const AMOSTRAS_POR_QUADRO = TAXA / 50;
const BYTES_POR_QUADRO = AMOSTRAS_POR_QUADRO * CANAIS * 2;

const rodar = promisify(execFile);

/*
  Conferir yt-dlp e ffmpeg ANTES de entrar no ar.

  Sem isso, a ausência de um dos dois só aparece quando alguém pede a primeira
  música — e aparece como silêncio, não como erro. Melhor recusar a subir.
*/
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

  /*
    A versão do yt-dlp é a data em que saiu (2026.8.19). Quando o YouTube muda
    a proteção, é a cópia velha que começa a dar 403 — e o sintoma é a música
    "acabar" no mesmo segundo em que começa, sem erro nenhum. Dois meses é o
    ponto em que já vale desconfiar.
  */
  const [ano, mes, dia] = ytdlp.split(".").map(Number);

  if (Number.isInteger(ano) && Number.isInteger(mes) && Number.isInteger(dia)) {
    const dias = Math.floor((Date.now() - Date.UTC(ano, mes - 1, dia)) / 86_400_000);
    if (dias > 60) {
      console.warn(`  ⚠️  já tem ${dias} dias. Se o YouTube der 403: brew upgrade yt-dlp`);
    }
  }
}

await conferirFerramentas();

/**
 * O que dizer a quem pediu a música, quando o yt-dlp desistiu.
 *
 * O erro dele é uma parede de texto no log, e ninguém no chat vai ler o log.
 * Cada caso aqui vira uma frase com o próximo passo dentro.
 */
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

/*
  A configuração de cada servidor, com um cache curto.

  Curto porque quem mexe no painel espera ver efeito em segundos, e não no
  próximo reinício do bot. Mas existe porque sem ele seria uma ida à rede por
  MENSAGEM lida — e o bot lê todas.
*/
const cacheDeConfig = new Map();
const CACHE_MS = 15_000;

/**
 * De qual servidor é este canal.
 *
 * A mensagem traz só o `channelId`, e a configuração é POR SERVIDOR. O mapa é
 * montado uma vez, com a API do bot, e só é refeito quando aparece um canal
 * desconhecido — canal novo criado depois que o bot subiu.
 */
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

  /// Uma remapeada de cada vez: sem isto, uma rajada de mensagens em canais
  /// novos dispararia dezenas de varreduras ao mesmo tempo.
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
    /// Painel fora do ar não pode derrubar o bot: ele cai no padrão e segue
    /// respondendo, só que sem as personalizações daquele servidor.
    .catch(() => PADRAO);

  cacheDeConfig.set(guildId, { em: Date.now(), valor });
  return valor;
}

/// Uma fila por canal de voz. Duas salas tocando ao mesmo tempo não se
/// atrapalham, e cada uma sabe como se desmontar.
const filas = new Map();

/// O gateway responde tudo como { ok, data } ou { ok: false, error }.
const pedir = (evento, dados) =>
  new Promise((ok, falha) =>
    socket.emit(evento, dados, (resposta) =>
      resposta?.ok ? ok(resposta.data) : falha(new Error(resposta?.error ?? "sem resposta")),
    ),
  );

/*
  Ouvir pelo socket, agir por HTTP.

  É a divisão que o Discord faz, e a razão é prática: o gateway existe para
  saber o que ACONTECEU, e um POST devolve o que foi criado, com o id e o
  status do que deu errado. Pelo socket, mandar era um `emit` no escuro.

  Continua sem `await` de propósito — o bot não tem o que fazer com a
  mensagem depois de mandada, e esperar a resposta atrasaria a música. Mas o
  erro agora aparece no log em vez de sumir.
*/
const falar = (channelId, content) =>
  pedirHttp(`/bot/canais/${channelId}/mensagens`, { metodo: "POST", corpo: { content } }).catch(
    (erro) => console.error("[falar]", erro.message),
  );

/**
 * Baixa e converte, em dois processos ligados por um cano.
 *
 * O yt-dlp entrega os bytes no stdout e o ffmpeg lê do stdin. É de propósito:
 * pedir só a URL (`yt-dlp -g`) e mandar o ffmpeg baixar dá 403, porque o
 * YouTube só aceita aquela URL com os mesmos cabeçalhos que o yt-dlp usou
 * para consegui-la. Quem sabe negociar com o YouTube é o yt-dlp; o ffmpeg só
 * converte o que já chegou.
 */
function abrirAudio(paginaDoVideo, aoFalhar) {
  const ytdlp = spawn("yt-dlp", [
    "-f", "bestaudio",
    "--no-playlist",
    "--quiet",
    "--no-warnings",
    "-o", "-",
    paginaDoVideo,
  ]);

  const ffmpeg = spawn("ffmpeg", [
    "-i", "pipe:0",
    "-loglevel", "error",
    "-vn",
    "-ar", String(TAXA),
    "-ac", String(CANAIS),
    "-f", "s16le",
    "pipe:1",
  ]);

  ytdlp.stdout.pipe(ffmpeg.stdin);

  /// Sem isto, o erro morre calado e a música "acaba" em silêncio no mesmo
  /// segundo em que começou — foi assim que este bug se escondeu da primeira vez.
  ///
  /// Guardado também em memória, e não só no console: quem pediu a música está
  /// no chat, e é lá que a explicação precisa aparecer.
  let reclamacao = "";

  const relatar = (quem) => (dados) => {
    const texto = dados.toString().trim();
    if (!texto) return;

    console.error(`[${quem}]`, texto);
    /// Um teto, porque o ffmpeg sabe repetir a mesma linha por minutos.
    if (reclamacao.length < 4_000) reclamacao += `${texto}\n`;
  };

  ytdlp.stderr.on("data", relatar("yt-dlp"));
  ffmpeg.stderr.on("data", relatar("ffmpeg"));

  ytdlp.on("error", aoFalhar);
  ffmpeg.on("error", aoFalhar);

  /// O cano quebra quando o ffmpeg é morto pelo !skip. Não é erro nosso.
  ytdlp.stdin?.on("error", () => undefined);
  ffmpeg.stdin.on("error", () => undefined);

  return {
    saida: ffmpeg.stdout,
    motivo: () => diagnosticar(reclamacao),
    matar: () => {
      ytdlp.kill("SIGKILL");
      ffmpeg.kill("SIGKILL");
    },
  };
}

async function entrarNaVoz(channelId) {
  const jaEsta = filas.get(channelId);

  /*
    A fila guardada só vale se a sala ainda estiver de pé.

    Quando alguém clica em "Desconectar" no menu do bot, quem derruba a
    conexão é o servidor — e o bot não ficava sabendo de nada. A fila
    continuava no mapa apontando para uma sala morta, então o `/play` seguinte
    empilhava música numa fila que nunca ia tocar: "entrou na fila (posição
    1)", "(posição 2)", e silêncio. Só reiniciando o processo ele voltava.
  */
  if (jaEsta?.sala.isConnected) return jaEsta;

  if (jaEsta) {
    largarFila(jaEsta);
    await jaEsta.sala.disconnect().catch(() => undefined);
  }

  const { url, token } = await pedir("voice:token", { channelId });

  const sala = new Room();

  /// A queda pode vir de qualquer lado: desconexão pelo app, servidor de voz
  /// reiniciando, internet caindo. Em todas o remédio é o mesmo — esquecer
  /// esta fila, para a próxima música começar do zero.
  sala.on(RoomEvent.Disconnected, () => {
    const atual = filas.get(channelId);
    if (atual?.sala !== sala) return;

    console.log(`saí da chamada de ${channelId} (a conexão caiu ou me desconectaram)`);
    avisarQueCaiu(atual);
    largarFila(atual);
  });

  await sala.connect(url, token, { autoSubscribe: false, dynacast: true });

  const fonte = new AudioSource(TAXA, CANAIS);
  const track = LocalAudioTrack.createAudioTrack("musica", fonte);

  const opcoes = new TrackPublishOptions();
  opcoes.source = TrackSource.SOURCE_MICROPHONE;
  await sala.localParticipant.publishTrack(track, opcoes);

  /// Aparecer na lista de quem está na chamada. Sem isto o bot toca, mas
  /// ninguém vê que ele está ali.
  await pedir("voice:join", { channelId });

  const fila = {
    channelId,
    sala,
    fonte,
    musicas: [],
    tocando: null,
    audio: null,
    parando: false,
    /// o canal de texto do último comando: é para lá que vai o aviso se a
    /// chamada cair, porque a fila morre junto e ninguém entenderia o silêncio
    canalDeAviso: null,
  };
  filas.set(channelId, fila);

  return fila;
}

/**
 * O recado de que a fila morreu.
 *
 * Sem ele, quem desconectou o bot (ou perdeu a internet) vê as músicas
 * simplesmente pararem e o próximo `/play` começar do nada — sem entender
 * para onde foi o resto da fila.
 */
function avisarQueCaiu(fila) {
  if (!fila.canalDeAviso || !fila.tocando) return;

  const quantas = fila.musicas.length;
  const resto = quantas > 1 ? ` As outras ${quantas - 1} da fila foram junto.` : "";

  falar(fila.canalDeAviso, `🔌 Saí da chamada.${resto} Chame de novo com \`/play\` quando quiser.`);
}

/// Esquecer a fila, sem falar com o servidor — é o que serve quando quem
/// mandou o bot sair foi o próprio servidor.
function largarFila(fila) {
  fila.parando = true;
  fila.audio?.matar();
  filas.delete(fila.channelId);
}

async function sairDaVoz(fila) {
  largarFila(fila);

  socket.emit("voice:leave", {});
  await fila.sala.disconnect().catch(() => undefined);
}

/**
 * Toca a primeira da fila e segue para a próxima quando acabar.
 *
 * O ritmo vem de um relógio nosso, e não da velocidade com que o ffmpeg
 * entrega os bytes: ele converte muito mais rápido que o tempo real, e sem
 * segurar o passo a música inteira iria embora em poucos segundos.
 */
async function tocarProxima(fila, avisarEm) {
  const musica = fila.musicas[0];

  if (!musica) {
    fila.tocando = null;
    if (avisarEm) falar(avisarEm, "Fila vazia. Saindo do canal.");
    await sairDaVoz(fila);
    return;
  }

  fila.tocando = musica;
  /*
    O endereço vai junto do título.

    O Gravaê monta o cartão de qualquer link que apareça numa mensagem — capa,
    canal e botão de tocar. Só que o cartão precisa do LINK, e o bot vinha
    anunciando só o nome: "Tocando **MC Menor do Chapa**" não dizia de onde
    saiu nem mostrava a capa. Com a URL na mesma linha, o anúncio do que está
    tocando passa a ter a cara do vídeo.
  */
  if (avisarEm) {
    falar(avisarEm, `▶️ Tocando **${musica.titulo}** (${musica.duracao})\n${musica.url}`);
  }

  const audio = abrirAudio(musica.url, (erro) => console.error("falha ao abrir o áudio:", erro));
  fila.audio = audio;

  let sobra = Buffer.alloc(0);
  let proximoQuadro = Date.now();
  let veioAlgo = false;

  for await (const pedaco of audio.saida) {
    veioAlgo = true;
    if (fila.parando) return;

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

  /// Nenhum byte é sintoma de falha lá atrás (vídeo indisponível, região
  /// bloqueada, yt-dlp velho) — e não de uma música que simplesmente acabou.
  if (!veioAlgo && avisarEm) {
    const motivo = audio.motivo() ?? "O log do bot tem o motivo.";
    falar(avisarEm, `Não consegui tocar **${musica.titulo}**. ${motivo}`);
  }

  /// Só tira da fila agora: enquanto tocava, ela precisava estar lá para o
  /// "!fila" mostrar o que está no ar.
  fila.musicas.shift();
  return tocarProxima(fila, avisarEm);
}

async function comandoPlay(mensagem, busca, config) {
  const { channelId: canalDeVoz } = await pedir("voice:onde", { userId: mensagem.author.id });

  if (!canalDeVoz) {
    return falar(mensagem.channelId, "Entra num canal de voz primeiro que eu te acompanho.");
  }

  const resultado = await yts(busca);
  const video = resultado.videos?.[0];

  if (!video) return falar(mensagem.channelId, `Não achei nada para **${busca}**.`);

  const fila = await entrarNaVoz(canalDeVoz);

  if (fila.musicas.length >= config.filaMaxima) {
    return falar(mensagem.channelId, `A fila está cheia (${config.filaMaxima}). Espere esvaziar.`);
  }

  fila.canalDeAviso = mensagem.channelId;

  const musica = { titulo: video.title, url: video.url, duracao: video.timestamp };
  fila.musicas.push(musica);

  /// `anunciarMusica` desligado silencia o "tocando agora", mas nunca as
  /// respostas a um comando: quem escreveu espera retorno.
  const avisarEm = config.anunciarMusica ? mensagem.channelId : null;

  if (fila.tocando) {
    falar(
      mensagem.channelId,
      `➕ **${musica.titulo}** entrou na fila (posição ${fila.musicas.length - 1}).\n${musica.url}`,
    );
  } else {
    void tocarProxima(fila, avisarEm);
  }
}

/// Boas-vindas do BOT — diferente das do servidor. Esta é invenção do dev, e
/// só existe porque alguém a configurou no painel dele.
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
  /// O comando vem do chat, que pode não ser o canal de voz. Com uma sala só
  /// tocando, é ela; com várias, some pelo autor.
  return [...filas.values()][0] ?? null;
}

/*
  O que o bot declara saber fazer.

  A mesma lista que o app desenha quando alguém digita "/" — nome, para que
  serve e o que ele espera. É o que troca "descobrir o comando pelo README"
  por "escolher da lista".
*/
const COMANDOS = [
  {
    nome: "play",
    descricao: "Toca uma música do YouTube",
    opcoes: [
      { nome: "busca", descricao: "Nome da música ou link", tipo: "texto", obrigatoria: true },
    ],
  },
  { nome: "skip", descricao: "Pula a música atual" },
  { nome: "stop", descricao: "Para tudo e sai do canal de voz" },
  { nome: "fila", descricao: "Mostra o que vem por aí" },
];

/**
 * Um comando, venha de onde vier.
 *
 * `de` é só o que os comandos precisam saber de quem pediu: em que canal
 * responder e quem foi. Vem da mensagem quando alguém digita "!play", e do
 * evento quando alguém escolhe "/play" na lista — daí valer a pena o mesmo
 * corpo para os dois, em vez de duas cópias que um dia divergem.
 */
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
        /// A fila não leva link: seriam cinco cartões um embaixo do outro,
        /// e o que se quer dali é a ordem, não a capa de cada um.
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

  /// A cada partida, e a lista inteira: o que sumir daqui some do app, sem o
  /// bot precisar lembrar o que registrou da última vez.
  await pedirHttp("/bot/comandos", { metodo: "PUT", corpo: { comandos: COMANDOS } })
    .then(() => console.log(`${COMANDOS.length} comandos de barra registrados`))
    .catch((erro) => console.error("[comandos]", erro.message));
});
socket.on("connect_error", (e) => console.error("não entrou:", e.message));

/*
  Desconectado ou movido pelo app.

  O servidor manda `voice:move` com o canal vazio quando alguém desconecta o
  bot pelo menu, e com outro canal quando o move. Nos dois casos a sala atual
  não vale mais: o bot larga a fila e fica pronto para o próximo `/play` —
  que entra de novo, no canal de quem pediu.
*/
socket.on("voice:move", async ({ channelId }) => {
  for (const fila of [...filas.values()]) {
    avisarQueCaiu(fila);
    largarFila(fila);
    await fila.sala.disconnect().catch(() => undefined);
  }

  console.log(channelId ? `me moveram para ${channelId}` : "me desconectaram da chamada");
});

/*
  O comando de barra chegando.

  Repare no que NÃO está aqui: nada de achar o prefixo, cortar a string,
  conferir se veio argumento. O servidor já validou contra o que este bot
  declarou, e `opcoes` chega separado e no tipo certo.
*/
socket.on("command:invoked", async ({ channelId, comando, opcoes, usuario }) => {
  const config = await configDe(await servidorDe(channelId));

  /*
    O "Canal dos comandos" do painel vale aqui também.

    Mas com resposta, e não com silêncio: o comando aparece na lista em todo
    canal, então quem escolheu num canal errado precisa saber por que nada
    aconteceu. No caminho do texto, ignorar é certo — ali a pessoa nem sabia
    que estava falando com o bot.
  */
  if (config.canalDeComandos && config.canalDeComandos !== channelId) {
    return falar(channelId, `Meus comandos são no <#${config.canalDeComandos}>.`);
  }

  await executar({ channelId, author: usuario }, comando, opcoes.busca ?? "", config);
});

socket.on("message:created", async (mensagem) => {
  if (mensagem.author.isBot) return;

  const config = await configDe(await servidorDe(mensagem.channelId));

  /// Preso a um canal? Então é só ali. É o "Canal dos comandos" do painel.
  if (config.canalDeComandos && config.canalDeComandos !== mensagem.channelId) return;

  const texto = (mensagem.content ?? "").trim();
  const [bruto, ...resto] = texto.split(/\s+/);
  const argumento = resto.join(" ");

  /// O prefixo vem do painel: com "+" configurado, o comando é "+play".
  if (!bruto?.startsWith(config.prefixo)) return;

  await executar(mensagem, bruto.slice(config.prefixo.length), argumento, config);
});
