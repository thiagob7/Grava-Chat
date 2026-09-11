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

const refusal = async (path, { token, body, method = "POST", form } = {}) => {
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

const owner = await api("/auth/dev-login", { body: { email: "dono-enfeite@gravae.io", displayName: "Dono Enfeite" } });
const member = await api("/auth/dev-login", { body: { email: "membro-enfeite@gravae.io", displayName: "Membro Simples" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Enfeites" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: member.accessToken });

await api("/me", { token: owner.accessToken, method: "PATCH", body: { profile: null } });
await api("/me", { token: member.accessToken, method: "PATCH", body: { profile: null } });

console.log("\n== antes de personalizar ==");
let detail = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
if (!("profiles" in detail)) throw new Error("o detalhe nao trouxe `profiles`");
ok("`profiles` existe no detalhe");
if (Object.keys(detail.profiles).length !== 0) throw new Error(`quem nao personalizou nao devia estar no mapa: ${JSON.stringify(detail.profiles)}`);
ok("quem nao personalizou fica FORA do mapa (nao vira `{}`)");

console.log("\n== depois de personalizar ==");
await api("/me", {
  token: owner.accessToken,
  method: "PATCH",
  body: { profile: { name: { font: "manuscrita", effect: "gradiente", color: "#ec4899", color2: "#3b82f6" }, decoration: "aurora", frame: "dourada" } },
});

detail = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const my = detail.profiles[owner.user.id];
if (!my) throw new Error("quem personalizou nao apareceu no mapa");
ok(`o mapa traz o enfeite: ${JSON.stringify(my)}`);
if (detail.profiles[member.user.id]) throw new Error("o membro sem enfeite entrou no mapa");
ok("o membro sem enfeite continua fora");

const author = detail.members.find((m) => m.user.id === owner.user.id).user;
if ("perfil" in author || "nome" in author) throw new Error("enfeite vazou pra `members[].user` — e o mesmo objeto de `message.author`");
ok("`members[].user` continua limpo (e o mesmo objeto que viaja em cada mensagem)");

console.log("\n== cartao de perfil ==");
const card = await api(`/users/${owner.user.id}`, { token: member.accessToken, method: "GET" });
if (card.profile?.name?.effect !== "gradiente") throw new Error(`o cartao nao trouxe o enfeite: ${JSON.stringify(card.profile)}`);
ok("o cartao de perfil traz o enfeite (e o que faz funcionar na DM)");

console.log("\n== teto por finalidade ==");
const mega = 1024 * 1024;
ok(`presign de anexo com 3 MB passa: ${(await api("/uploads/presign", { token: owner.accessToken, body: { filename: "a.png", contentType: "image/png", size: 3 * mega, purpose: "anexo" } })).attachment.size} bytes`);
ok(`o MESMO tamanho como avatar e recusado: ${await refusal("/uploads/presign", { token: owner.accessToken, body: { filename: "a.png", contentType: "image/png", size: 3 * mega, purpose: "avatar" } })}`);
ok(`e como icone de cargo tambem: ${await refusal("/uploads/presign", { token: owner.accessToken, body: { filename: "a.png", contentType: "image/png", size: 300 * 1024, purpose: "iconeDeCargo" } })}`);

const large = new FormData();
large.append("file", new Blob([new Uint8Array(3 * mega)], { type: "image/png" }), "grande.png");
ok(`upload de 3 MB pela API como avatar e recusado: ${await refusal("/uploads?purpose=avatar", { token: owner.accessToken, form: large })}`);

console.log("\n== banner tem que ser do nosso bucket ==");
ok(`endereco externo recusado: ${await refusal("/me", { token: owner.accessToken, method: "PATCH", body: { profile: { bannerUrl: "https://rastreador.example/pixel.png" } } })}`);
ok(`javascript: recusado: ${await refusal("/me", { token: owner.accessToken, method: "PATCH", body: { profile: { bannerUrl: "javascript:alert(1)" } } })}`);

console.log("\n== voltar ao padrao ==");
const zeroed = await api("/me", { token: owner.accessToken, method: "PATCH", body: { profile: null } });
if (zeroed.profile !== null) throw new Error(`perfil: null devia apagar, veio ${JSON.stringify(zeroed.profile)}`);
ok("`perfil: null` apaga o documento embutido");

console.log("\n== mencoes ==");
const channel = (await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" })).channels.find((c) => c.type === "TEXT");
const role = await api(`/guilds/${guild.id}/roles`, { token: owner.accessToken, body: { name: "Mencionavel" } });
await api(`/guilds/${guild.id}/roles/${role.id}`, { token: owner.accessToken, method: "PATCH", body: { mentionable: true } });
const closed = await api(`/guilds/${guild.id}/roles`, { token: owner.accessToken, body: { name: "Fechado" } });

const connect = (token) =>
  new Promise((resolve, reject) => {
    const s = io(BASE, { auth: { token }, transports: ["websocket"] });
    s.on("connect", () => resolve(s));
    s.on("connect_error", reject);
  });

const emit = (s, event, payload) =>
  new Promise((resolve, reject) =>
    s.emit(event, payload, (r) => (r.ok ? resolve(r.data) : reject(new Error(r.error)))),
  );

const socketOwner = await connect(owner.accessToken);
const socketMember = await connect(member.accessToken);
await emit(socketOwner, "channel:subscribe", { channelId: channel.id });
await emit(socketMember, "channel:subscribe", { channelId: channel.id });

let nonce = 0;
const send = async (token, content) => {
  const { id } = await emit(token === owner.accessToken ? socketOwner : socketMember, "message:send", {
    channelId: channel.id,
    content,
    nonce: `smoke-${nonce++}`,
  });

  const past = await api(`/channels/${channel.id}/messages`, { token, method: "GET" });
  return past.messages.find((m) => m.id === id);
};

const withRole = await send(member.accessToken, `oi <@&${role.id}> e <@&${closed.id}>`);
if (withRole.mentionRoleIds.length !== 1 || withRole.mentionRoleIds[0] !== role.id) {
  throw new Error(`so o cargo mencionavel devia pingar: ${JSON.stringify(withRole.mentionRoleIds)}`);
}
ok("cargo mencionavel pinga; cargo fechado nao (o `mentionable` deixou de ser flag morta)");

const withAll = await send(member.accessToken, "bom dia @everyone");
if (withAll.mentionEveryone !== false) throw new Error("membro comum nao devia poder @everyone");
if (withAll.content !== "bom dia @everyone") throw new Error("a mensagem devia passar inteira");
ok("sem permissao, @everyone e APAGADO e a mensagem passa (nao vira erro)");

const fromOwner = await send(owner.accessToken, "@everyone reuniao");
if (fromOwner.mentionEveryone !== true) throw new Error("o dono devia poder @everyone");
ok("com permissao, @everyone vale");

const user = await send(owner.accessToken, `<@${member.user.id}> olha isso`);
if (user.mentions[0] !== member.user.id) throw new Error("mencao de usuario nao gravou");
if (user.mentionRoleIds.length) throw new Error("mencao de usuario nao pode virar cargo");
ok("usuario e cargo em campos separados — o contador nao trata cargo como gente");

const states = await api("/me/read-states", { token: member.accessToken, method: "GET" });
const fromChannel = states.find((e) => e.channelId === channel.id);
if (!fromChannel || fromChannel.mentionCount < 1) {
  throw new Error(`mentionCount devia contar as mencoes: ${JSON.stringify(fromChannel)}`);
}
ok(`mentionCount deixou de ser campo morto: ${fromChannel.mentionCount}`);

console.log("\n== enfeite de cargo ==");
const pintado = await api(`/guilds/${guild.id}/roles/${role.id}`, {
  token: owner.accessToken,
  method: "PATCH",
  body: { color: "#22d3ee", colorSecondary: "#a855f7", style: "holografico", iconEmoji: "\u26a1" },
});
if (pintado.style !== "holografico" || pintado.colorSecondary !== "#a855f7") {
  throw new Error(`o cargo devia guardar estilo e segunda cor: ${JSON.stringify(pintado)}`);
}
ok("cargo guarda cor secundaria, estilo e emoji");

const everyone = (await api(`/guilds/${guild.id}/roles`, { token: owner.accessToken, method: "GET" })).find((r) => r.isEveryone);
if ((await refusal(`/guilds/${guild.id}/roles/${everyone.id}`, { token: owner.accessToken, method: "PATCH", body: { style: "holografico" } })) !== 400) {
  throw new Error("@everyone holografico repintaria o nome de TODO MUNDO");
}
ok("@everyone recusa enfeite — senao repintaria o nome de todo mundo");

if ((await refusal(`/guilds/${guild.id}/roles/${everyone.id}`, { token: owner.accessToken, method: "PATCH", body: { hoist: false } })) !== 400) {
  throw new Error("`hoist: false` escapava da guarda por ser valor falso");
}
ok("`hoist: false` tambem e barrado (a guarda testava truthiness)");

console.log("\n== emblemas ==");
const badge = await api(`/guilds/${guild.id}/emblemas`, { token: owner.accessToken, body: { name: "DEV", emoji: "\u26a1" } });
ok(`o servidor cria: ${badge.name} ${badge.emoji}`);

if ((await refusal(`/guilds/${guild.id}/emblemas`, { token: member.accessToken, body: { name: "Falso", emoji: "x" } })) !== 403) {
  throw new Error("criar emblema exige MANAGE_GUILD");
}
ok("membro comum NAO cria");

await api(`/guilds/${guild.id}/members/@me/emblemas`, { token: member.accessToken, method: "PUT", body: { emblemIds: [badge.id] } });
const withBadge = await api(`/guilds/${guild.id}`, { token: member.accessToken, method: "GET" });
if (withBadge.profiles[member.user.id]?.badges?.[0] !== badge.id) {
  throw new Error(`o emblema vestido devia aparecer no mapa: ${JSON.stringify(withBadge.profiles)}`);
}
ok("mas VESTE sozinho, sem pedir a ninguem");

const fromOther = await api(`/guilds/${guild.id}/members/@me/emblemas`, { token: member.accessToken, method: "PUT", body: { emblemIds: ["6a8781da7415b08f427be1a4"] } });
if (fromOther.emblemIds.length) throw new Error("emblema de fora do servidor nao pode ser vestido");
ok("emblema que nao e deste servidor e descartado");

console.log("\n== etiqueta ==");
await api("/me", { token: member.accessToken, method: "PATCH", body: { profile: { tag: "Th" } } });
const withTag = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
if (withTag.profiles[member.user.id]?.tag !== "Th") throw new Error("a etiqueta nao viajou no mapa");
ok("a etiqueta pessoal viaja no mapa `profiles`");

console.log("\n== etiqueta do servidor (a que a pessoa ESCOLHE vestir) ==");
await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "PATCH", body: { tag: "TST", tagIcon: "\u26a1" } });
await api("/me", { token: member.accessToken, method: "PATCH", body: { profile: { tag: "Th", tagGuildId: guild.id } } });

const withTag = await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "GET" });
const myTag = withTag.profiles[member.user.id]?.serverTag;
if (myTag?.tag !== "TST") {
  throw new Error(`a etiqueta escolhida devia vir resolvida: ${JSON.stringify(myTag)}`);
}
ok(`vem RESOLVIDA no mapa (tag e icone, nao so o id): ${myTag.tag}`);

if (withTag.profiles[owner.user.id]?.serverTag) {
  throw new Error("quem NAO escolheu nao pode aparecer com a etiqueta do servidor");
}
ok("quem nao escolheu continua sem etiqueta — ela deixou de grudar em todo mundo");

const other = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Enfeites Outro" } });
if ((await refusal("/me", { token: member.accessToken, method: "PATCH", body: { profile: { tagGuildId: other.id } } })) !== 400) {
  throw new Error("vestir etiqueta de servidor que nao e meu devia ser recusado");
}
ok("nao da pra vestir a etiqueta de um servidor de que voce nao participa");
await api(`/guilds/${other.id}`, { token: owner.accessToken, method: "DELETE" });

const inDm = await api(`/users/${member.user.id}`, { token: owner.accessToken, method: "GET" });
if (inDm.serverTag?.tag !== "TST") throw new Error("a etiqueta devia acompanhar a pessoa no cartao");
ok("e ela ACOMPANHA a pessoa — aparece no cartao, fora do servidor de origem");

console.log("\n== cartao do servidor (clicar na etiqueta) ==");
const preview = await api(`/guilds/${guild.id}/preview`, { token: member.accessToken, method: "GET" });
if (preview.tag !== "TST" || preview.memberCount !== 2) {
  throw new Error(`previa incompleta: ${JSON.stringify(preview)}`);
}
ok(`nome, etiqueta, ${preview.memberCount} membros e ${preview.onlineCount} online`);
if (!preview.amMember) throw new Error("quem e membro devia poder ir pro servidor");
ok("diz se voce ja esta dentro (e o que escolhe o botao)");

const withoutTag = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Sem Etiqueta" } });
if ((await refusal(`/guilds/${withoutTag.id}/preview`, { token: member.accessToken, method: "GET" })) !== 404) {
  throw new Error("servidor SEM etiqueta nao pode ser consultado por id");
}
ok("servidor sem etiqueta nao responde — a etiqueta e que o anuncia");
await api(`/guilds/${withoutTag.id}`, { token: owner.accessToken, method: "DELETE" });

console.log("\n== nota privada ==");
await api(`/users/${owner.user.id}/nota`, { token: member.accessToken, method: "PUT", body: { text: "amigo do Leo" } });
const memberCard = await api(`/users/${owner.user.id}`, { token: member.accessToken, method: "GET" });
if (memberCard.note !== "amigo do Leo") throw new Error("a nota nao voltou pra quem escreveu");
ok("quem escreveu le a propria nota");

const ownerCard = await api(`/users/${member.user.id}`, { token: owner.accessToken, method: "GET" });
if (ownerCard.note !== null) throw new Error("a nota vazou pra outra pessoa");
ok("e MAIS NINGUEM le");

await api(`/users/${owner.user.id}/nota`, { token: member.accessToken, method: "PUT", body: { text: "  " } });
if ((await api(`/users/${owner.user.id}`, { token: member.accessToken, method: "GET" })).note !== null) {
  throw new Error("nota vazia devia apagar");
}
ok("texto vazio apaga a nota");

console.log("\n== importar imagem (o GIF da faixa) ==");
if ((await refusal("/uploads/importar", { token: owner.accessToken, body: { url: "http://169.254.169.254/latest/meta-data/", purpose: "banner" } })) !== 400) {
  throw new Error("host de fora da lista devia ser recusado (SSRF)");
}
ok("endereco fora da lista de hosts e recusado antes de qualquer fetch");

const mine = await api("/guilds", { token: owner.accessToken, method: "GET" });
for (const g of mine.filter((g) => g.name === "Teste Enfeites")) {
  await api(`/guilds/${g.id}`, { token: owner.accessToken, method: "DELETE" });
}
socketOwner.close();
socketMember.close();
console.log("\ntudo verde\n");
