const BASE = "http://localhost:3333";
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, body, method = "POST" } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

const refusal = async (expected, description, fn) => {
  try {
    await fn();
    throw new Error(`FALHOU: ${description}`);
  } catch (e) {
    if (!new RegExp(`-> ${expected}`).test(e.message)) throw e;
    ok(`${description} -> ${expected}`);
  }
};

const owner = await api("/auth/dev-login", { body: { email: "dono-exp@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-exp@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: owner.accessToken, body: { name: "Teste Expressoes" } });
const invite = await api(`/guilds/${guild.id}/invites`, { token: owner.accessToken, body: {} });
await api(`/invites/${invite.code}/join`, { token: ze.accessToken });

console.log("\n== emoji ==");
const emoji = await api(`/guilds/${guild.id}/emojis`, {
  token: owner.accessToken,
  body: { name: "gravae", url: "https://exemplo/emoji.png" },
});
ok(`emoji :${emoji.name}: criado`);

await refusal(400, "nome de emoji com espaco e recusado", () =>
  api(`/guilds/${guild.id}/emojis`, {
    token: owner.accessToken,
    body: { name: "nome com espaco", url: "https://exemplo/e.png" },
  }),
);

await refusal(400, "dois emojis com o mesmo nome nao", () =>
  api(`/guilds/${guild.id}/emojis`, {
    token: owner.accessToken,
    body: { name: "gravae", url: "https://exemplo/outro.png" },
  }),
);

await refusal(403, "quem nao tem MANAGE_EXPRESSIONS nao sobe emoji", () =>
  api(`/guilds/${guild.id}/emojis`, {
    token: ze.accessToken,
    body: { name: "hacker", url: "https://exemplo/h.png" },
  }),
);

console.log("\n== figurinha ==");
const sticker = await api(`/guilds/${guild.id}/stickers`, {
  token: owner.accessToken,
  body: {
    name: "abraco",
    relatedEmoji: "🤗",
    url: "https://exemplo/fig.png",
    size: 400 * 1024,
  },
});
ok(`figurinha "${sticker.name}" criada`);

await refusal(400, "figurinha acima de 512 KB e recusada", () =>
  api(`/guilds/${guild.id}/stickers`, {
    token: owner.accessToken,
    body: { name: "gorda", relatedEmoji: "😅", url: "https://exemplo/g.png", size: 900 * 1024 },
  }),
);

console.log("\n== som ==");
const sound = await api(`/guilds/${guild.id}/sounds`, {
  token: owner.accessToken,
  body: { name: "risada", emoji: "😂", url: "https://exemplo/som.mp3", volume: 0.8, size: 100 * 1024 },
});
ok(`som "${sound.name}" criado com volume ${sound.volume}`);

console.log("\n== lista para o seletor ==");
const everything = await api(`/guilds/${guild.id}/expressions`, { token: ze.accessToken, method: "GET" });
if (everything.emojis.length !== 1 || everything.stickers.length !== 1 || everything.sounds.length !== 1) {
  throw new Error("a lista de expressoes nao veio completa");
}
if (!everything.emojis[0].createdBy) throw new Error("faltou quem enviou");
ok(`membro comum ve as tres listas, com quem enviou (${everything.emojis[0].createdBy.displayName})`);

console.log("\n== apagar ==");
await api(`/guilds/${guild.id}/emojis/${emoji.id}`, { token: owner.accessToken, method: "DELETE" });
const after = await api(`/guilds/${guild.id}/expressions`, { token: owner.accessToken, method: "GET" });
if (after.emojis.length !== 0) throw new Error("o emoji apagado continua na lista");
ok("apagar tira da lista");

const record = await api(`/guilds/${guild.id}/audit-log`, { token: owner.accessToken, method: "GET" });
const actions = record.entries.map((e) => e.action);
for (const expected of ["emoji.create", "emoji.delete", "sticker.create", "sound.create"]) {
  if (!actions.includes(expected)) throw new Error(`a auditoria nao registrou ${expected}`);
}
ok("cada expressao criada e apagada aparece no registro de auditoria");

await api(`/guilds/${guild.id}`, { token: owner.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
