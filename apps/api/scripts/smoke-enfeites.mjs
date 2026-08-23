/**
 * Fase 1: o mapa `profiles` no detalhe do servidor, e o enfeite no cartao de
 * perfil. Cria contas descartaveis (o `limpar-dados-de-teste` conhece o padrao).
 */
import { io } from "socket.io-client";

const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, body, method = "POST" } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

/** Espera a recusa: devolve o status em vez de estourar. */
const recusa = async (path, { token, body, method = "POST", form } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  if (res.ok) throw new Error(`${method} ${path} devia ter sido recusado, mas passou`);
  return res.status;
};

const dono = await api("/auth/dev-login", { body: { email: "dono-enfeite@gravae.io", displayName: "Dono Enfeite" } });
const membro = await api("/auth/dev-login", { body: { email: "membro-enfeite@gravae.io", displayName: "Membro Simples" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Enfeites" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: membro.accessToken });

/*
 * As contas do dev-login sobrevivem entre execucoes: sem zerar o enfeite, a
 * segunda rodada comeca com o que a primeira gravou e o "antes" nunca e antes.
 */
await api("/me", { token: dono.accessToken, method: "PATCH", body: { perfil: null } });
await api("/me", { token: membro.accessToken, method: "PATCH", body: { perfil: null } });

console.log("\n== antes de personalizar ==");
let detail = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
if (!("profiles" in detail)) throw new Error("o detalhe nao trouxe `profiles`");
ok("`profiles` existe no detalhe");
if (Object.keys(detail.profiles).length !== 0) throw new Error(`quem nao personalizou nao devia estar no mapa: ${JSON.stringify(detail.profiles)}`);
ok("quem nao personalizou fica FORA do mapa (nao vira `{}`)");

console.log("\n== depois de personalizar ==");
await api("/me", {
  token: dono.accessToken,
  method: "PATCH",
  body: { perfil: { nome: { fonte: "manuscrita", efeito: "gradiente", cor: "#ec4899", cor2: "#3b82f6" }, decoracao: "aurora", moldura: "dourada" } },
});

detail = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const meu = detail.profiles[dono.user.id];
if (!meu) throw new Error("quem personalizou nao apareceu no mapa");
ok(`o mapa traz o enfeite: ${JSON.stringify(meu)}`);
if (detail.profiles[membro.user.id]) throw new Error("o membro sem enfeite entrou no mapa");
ok("o membro sem enfeite continua fora");

const autor = detail.members.find((m) => m.user.id === dono.user.id).user;
if ("perfil" in autor || "nome" in autor) throw new Error("enfeite vazou pra `members[].user` — e o mesmo objeto de `message.author`");
ok("`members[].user` continua limpo (e o mesmo objeto que viaja em cada mensagem)");

console.log("\n== cartao de perfil ==");
const cartao = await api(`/users/${dono.user.id}`, { token: membro.accessToken, method: "GET" });
if (cartao.perfil?.nome?.efeito !== "gradiente") throw new Error(`o cartao nao trouxe o enfeite: ${JSON.stringify(cartao.perfil)}`);
ok("o cartao de perfil traz o enfeite (e o que faz funcionar na DM)");



console.log("\n== teto por finalidade ==");
const mega = 1024 * 1024;
ok(`presign de anexo com 3 MB passa: ${(await api("/uploads/presign", { token: dono.accessToken, body: { filename: "a.png", contentType: "image/png", size: 3 * mega, purpose: "anexo" } })).attachment.size} bytes`);
ok(`o MESMO tamanho como avatar e recusado: ${await recusa("/uploads/presign", { token: dono.accessToken, body: { filename: "a.png", contentType: "image/png", size: 3 * mega, purpose: "avatar" } })}`);
ok(`e como icone de cargo tambem: ${await recusa("/uploads/presign", { token: dono.accessToken, body: { filename: "a.png", contentType: "image/png", size: 300 * 1024, purpose: "iconeDeCargo" } })}`);

/*
 * O caminho multipart tambem: hoje e ELE que esta em uso (o envio direto ao
 * bucket depende de uma politica de CORS que ainda nao existe). Um teto que so
 * o outro caminho respeita nao e teto nenhum.
 */
const grande = new FormData();
grande.append("file", new Blob([new Uint8Array(3 * mega)], { type: "image/png" }), "grande.png");
ok(`upload de 3 MB pela API como avatar e recusado: ${await recusa("/uploads?purpose=avatar", { token: dono.accessToken, form: grande })}`);

console.log("\n== banner tem que ser do nosso bucket ==");
ok(`endereco externo recusado: ${await recusa("/me", { token: dono.accessToken, method: "PATCH", body: { perfil: { bannerUrl: "https://rastreador.example/pixel.png" } } })}`);
ok(`javascript: recusado: ${await recusa("/me", { token: dono.accessToken, method: "PATCH", body: { perfil: { bannerUrl: "javascript:alert(1)" } } })}`);

console.log("\n== voltar ao padrao ==");
const zerado = await api("/me", { token: dono.accessToken, method: "PATCH", body: { perfil: null } });
if (zerado.perfil !== null) throw new Error(`perfil: null devia apagar, veio ${JSON.stringify(zerado.perfil)}`);
ok("`perfil: null` apaga o documento embutido");

console.log("\n== mencoes ==");
const canal = (await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" })).channels.find((c) => c.type === "TEXT");
const cargo = await api(`/guilds/${guild.id}/roles`, { token: dono.accessToken, body: { name: "Mencionavel" } });
await api(`/guilds/${guild.id}/roles/${cargo.id}`, { token: dono.accessToken, method: "PATCH", body: { mentionable: true } });
const fechado = await api(`/guilds/${guild.id}/roles`, { token: dono.accessToken, body: { name: "Fechado" } });

/* Mensagem vai por WebSocket: ela ja precisa ser distribuida pra sala inteira,
   e um POST faria a viagem duas vezes. */
const conectar = (token) =>
  new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ["websocket"] });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });

const emitir = (s, evento, payload) =>
  new Promise((resolve, reject) =>
    s.emit(evento, payload, (r) => (r.ok ? resolve(r.data) : reject(new Error(r.error)))),
  );

const socketDono = await conectar(dono.accessToken);
const socketMembro = await conectar(membro.accessToken);
await emitir(socketDono, "channel:subscribe", { channelId: canal.id });
await emitir(socketMembro, "channel:subscribe", { channelId: canal.id });

let nonce = 0;
/* O ack do socket devolve so o id — o resto vem do historico, que e o mesmo
   caminho por onde o front le. */
const enviar = async (token, content) => {
  const { id } = await emitir(token === dono.accessToken ? socketDono : socketMembro, "message:send", {
    channelId: canal.id,
    content,
    nonce: `smoke-${nonce++}`,
  });

  const historico = await api(`/channels/${canal.id}/messages`, { token, method: "GET" });
  return historico.messages.find((m) => m.id === id);
};

const comCargo = await enviar(membro.accessToken, `oi <@&${cargo.id}> e <@&${fechado.id}>`);
if (comCargo.mentionRoleIds.length !== 1 || comCargo.mentionRoleIds[0] !== cargo.id) {
  throw new Error(`so o cargo mencionavel devia pingar: ${JSON.stringify(comCargo.mentionRoleIds)}`);
}
ok("cargo mencionavel pinga; cargo fechado nao (o `mentionable` deixou de ser flag morta)");

const comTodos = await enviar(membro.accessToken, "bom dia @everyone");
if (comTodos.mentionEveryone !== false) throw new Error("membro comum nao devia poder @everyone");
if (comTodos.content !== "bom dia @everyone") throw new Error("a mensagem devia passar inteira");
ok("sem permissao, @everyone e APAGADO e a mensagem passa (nao vira erro)");

const doDono = await enviar(dono.accessToken, "@everyone reuniao");
if (doDono.mentionEveryone !== true) throw new Error("o dono devia poder @everyone");
ok("com permissao, @everyone vale");

const usuario = await enviar(dono.accessToken, `<@${membro.user.id}> olha isso`);
if (usuario.mentions[0] !== membro.user.id) throw new Error("mencao de usuario nao gravou");
if (usuario.mentionRoleIds.length) throw new Error("mencao de usuario nao pode virar cargo");
ok("usuario e cargo em campos separados — o contador nao trata cargo como gente");

const estados = await api("/me/read-states", { token: membro.accessToken, method: "GET" });
const doCanal = estados.find((e) => e.channelId === canal.id);
if (!doCanal || doCanal.mentionCount < 1) {
  throw new Error(`mentionCount devia contar as mencoes: ${JSON.stringify(doCanal)}`);
}
ok(`mentionCount deixou de ser campo morto: ${doCanal.mentionCount}`);

console.log("\n== enfeite de cargo ==");
const pintado = await api(`/guilds/${guild.id}/roles/${cargo.id}`, {
  token: dono.accessToken,
  method: "PATCH",
  body: { color: "#22d3ee", colorSecondary: "#a855f7", estilo: "holografico", iconEmoji: "\u26a1" },
});
if (pintado.estilo !== "holografico" || pintado.colorSecondary !== "#a855f7") {
  throw new Error(`o cargo devia guardar estilo e segunda cor: ${JSON.stringify(pintado)}`);
}
ok("cargo guarda cor secundaria, estilo e emoji");

const everyone = (await api(`/guilds/${guild.id}/roles`, { token: dono.accessToken, method: "GET" })).find((r) => r.isEveryone);
if ((await recusa(`/guilds/${guild.id}/roles/${everyone.id}`, { token: dono.accessToken, method: "PATCH", body: { estilo: "holografico" } })) !== 400) {
  throw new Error("@everyone holografico repintaria o nome de TODO MUNDO");
}
ok("@everyone recusa enfeite — senao repintaria o nome de todo mundo");

if ((await recusa(`/guilds/${guild.id}/roles/${everyone.id}`, { token: dono.accessToken, method: "PATCH", body: { hoist: false } })) !== 400) {
  throw new Error("`hoist: false` escapava da guarda por ser valor falso");
}
ok("`hoist: false` tambem e barrado (a guarda testava truthiness)");

console.log("\n== emblemas ==");
const emblema = await api(`/guilds/${guild.id}/emblemas`, { token: dono.accessToken, body: { nome: "DEV", emoji: "\u26a1" } });
ok(`o servidor cria: ${emblema.nome} ${emblema.emoji}`);

if ((await recusa(`/guilds/${guild.id}/emblemas`, { token: membro.accessToken, body: { nome: "Falso", emoji: "x" } })) !== 403) {
  throw new Error("criar emblema exige MANAGE_GUILD");
}
ok("membro comum NAO cria");

await api(`/guilds/${guild.id}/members/@me/emblemas`, { token: membro.accessToken, method: "PUT", body: { emblemIds: [emblema.id] } });
const comEmblema = await api(`/guilds/${guild.id}`, { token: membro.accessToken, method: "GET" });
if (comEmblema.profiles[membro.user.id]?.emblemas?.[0] !== emblema.id) {
  throw new Error(`o emblema vestido devia aparecer no mapa: ${JSON.stringify(comEmblema.profiles)}`);
}
ok("mas VESTE sozinho, sem pedir a ninguem");

const deOutro = await api(`/guilds/${guild.id}/members/@me/emblemas`, { token: membro.accessToken, method: "PUT", body: { emblemIds: ["6a8781da7415b08f427be1a4"] } });
if (deOutro.emblemIds.length) throw new Error("emblema de fora do servidor nao pode ser vestido");
ok("emblema que nao e deste servidor e descartado");

console.log("\n== etiqueta ==");
await api("/me", { token: membro.accessToken, method: "PATCH", body: { perfil: { etiqueta: "Th" } } });
const comEtiqueta = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
if (comEtiqueta.profiles[membro.user.id]?.etiqueta !== "Th") throw new Error("a etiqueta nao viajou no mapa");
ok("a etiqueta pessoal viaja no mapa `profiles`");

console.log("\n== etiqueta do servidor (a que a pessoa ESCOLHE vestir) ==");
await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "PATCH", body: { tag: "TST", tagIcon: "\u26a1" } });
await api("/me", { token: membro.accessToken, method: "PATCH", body: { perfil: { etiqueta: "Th", tagGuildId: guild.id } } });

const comTag = await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "GET" });
const minhaEtiqueta = comTag.profiles[membro.user.id]?.etiquetaDoServidor;
if (minhaEtiqueta?.tag !== "TST") {
  throw new Error(`a etiqueta escolhida devia vir resolvida: ${JSON.stringify(minhaEtiqueta)}`);
}
ok(`vem RESOLVIDA no mapa (tag e icone, nao so o id): ${minhaEtiqueta.tag}`);

if (comTag.profiles[dono.user.id]?.etiquetaDoServidor) {
  throw new Error("quem NAO escolheu nao pode aparecer com a etiqueta do servidor");
}
ok("quem nao escolheu continua sem etiqueta — ela deixou de grudar em todo mundo");

const outro = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Enfeites Outro" } });
if ((await recusa("/me", { token: membro.accessToken, method: "PATCH", body: { perfil: { tagGuildId: outro.id } } })) !== 400) {
  throw new Error("vestir etiqueta de servidor que nao e meu devia ser recusado");
}
ok("nao da pra vestir a etiqueta de um servidor de que voce nao participa");
await api(`/guilds/${outro.id}`, { token: dono.accessToken, method: "DELETE" });

const naDm = await api(`/users/${membro.user.id}`, { token: dono.accessToken, method: "GET" });
if (naDm.etiquetaDoServidor?.tag !== "TST") throw new Error("a etiqueta devia acompanhar a pessoa no cartao");
ok("e ela ACOMPANHA a pessoa — aparece no cartao, fora do servidor de origem");

console.log("\n== cartao do servidor (clicar na etiqueta) ==");
const previa = await api(`/guilds/${guild.id}/preview`, { token: membro.accessToken, method: "GET" });
if (previa.tag !== "TST" || previa.memberCount !== 2) {
  throw new Error(`previa incompleta: ${JSON.stringify(previa)}`);
}
ok(`nome, etiqueta, ${previa.memberCount} membros e ${previa.onlineCount} online`);
if (!previa.souMembro) throw new Error("quem e membro devia poder ir pro servidor");
ok("diz se voce ja esta dentro (e o que escolhe o botao)");

const semTag = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Sem Etiqueta" } });
if ((await recusa(`/guilds/${semTag.id}/preview`, { token: membro.accessToken, method: "GET" })) !== 404) {
  throw new Error("servidor SEM etiqueta nao pode ser consultado por id");
}
ok("servidor sem etiqueta nao responde — a etiqueta e que o anuncia");
await api(`/guilds/${semTag.id}`, { token: dono.accessToken, method: "DELETE" });

console.log("\n== nota privada ==");
await api(`/users/${dono.user.id}/nota`, { token: membro.accessToken, method: "PUT", body: { texto: "amigo do Leo" } });
const cartaoDoMembro = await api(`/users/${dono.user.id}`, { token: membro.accessToken, method: "GET" });
if (cartaoDoMembro.nota !== "amigo do Leo") throw new Error("a nota nao voltou pra quem escreveu");
ok("quem escreveu le a propria nota");

const cartaoDoDono = await api(`/users/${membro.user.id}`, { token: dono.accessToken, method: "GET" });
if (cartaoDoDono.nota !== null) throw new Error("a nota vazou pra outra pessoa");
ok("e MAIS NINGUEM le");

await api(`/users/${dono.user.id}/nota`, { token: membro.accessToken, method: "PUT", body: { texto: "  " } });
if ((await api(`/users/${dono.user.id}`, { token: membro.accessToken, method: "GET" })).nota !== null) {
  throw new Error("nota vazia devia apagar");
}
ok("texto vazio apaga a nota");

console.log("\n== importar imagem (o GIF da faixa) ==");
if ((await recusa("/uploads/importar", { token: dono.accessToken, body: { url: "http://169.254.169.254/latest/meta-data/", purpose: "banner" } })) !== 400) {
  throw new Error("host de fora da lista devia ser recusado (SSRF)");
}
ok("endereco fora da lista de hosts e recusado antes de qualquer fetch");

// leva junto o que ficou de execucoes anteriores que morreram no meio
const meus = await api("/guilds", { token: dono.accessToken, method: "GET" });
for (const g of meus.filter((g) => g.name === "Teste Enfeites")) {
  await api(`/guilds/${g.id}`, { token: dono.accessToken, method: "DELETE" });
}
socketDono.close();
socketMembro.close();
console.log("\ntudo verde\n");
