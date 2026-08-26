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

const recusa = async (esperado, descricao, fn) => {
  try {
    await fn();
    throw new Error(`FALHOU: ${descricao}`);
  } catch (e) {
    if (!new RegExp(`-> ${esperado}`).test(e.message)) throw e;
    ok(`${descricao} -> ${esperado}`);
  }
};

const dono = await api("/auth/dev-login", { body: { email: "dono-exp@gravae.io", displayName: "Dono" } });
const ze = await api("/auth/dev-login", { body: { email: "ze-exp@gravae.io", displayName: "Ze" } });

const guild = await api("/guilds", { token: dono.accessToken, body: { name: "Teste Expressoes" } });
const convite = await api(`/guilds/${guild.id}/invites`, { token: dono.accessToken, body: {} });
await api(`/invites/${convite.code}/join`, { token: ze.accessToken });

console.log("\n== emoji ==");
const emoji = await api(`/guilds/${guild.id}/emojis`, {
  token: dono.accessToken,
  body: { name: "gravae", url: "https://exemplo/emoji.png" },
});
ok(`emoji :${emoji.name}: criado`);

await recusa(400, "nome de emoji com espaco e recusado", () =>
  api(`/guilds/${guild.id}/emojis`, {
    token: dono.accessToken,
    body: { name: "nome com espaco", url: "https://exemplo/e.png" },
  }),
);

await recusa(400, "dois emojis com o mesmo nome nao", () =>
  api(`/guilds/${guild.id}/emojis`, {
    token: dono.accessToken,
    body: { name: "gravae", url: "https://exemplo/outro.png" },
  }),
);

await recusa(403, "quem nao tem MANAGE_EXPRESSIONS nao sobe emoji", () =>
  api(`/guilds/${guild.id}/emojis`, {
    token: ze.accessToken,
    body: { name: "hacker", url: "https://exemplo/h.png" },
  }),
);

console.log("\n== figurinha ==");
const figurinha = await api(`/guilds/${guild.id}/stickers`, {
  token: dono.accessToken,
  body: {
    name: "abraco",
    relatedEmoji: "🤗",
    url: "https://exemplo/fig.png",
    size: 400 * 1024,
  },
});
ok(`figurinha "${figurinha.name}" criada`);

await recusa(400, "figurinha acima de 512 KB e recusada", () =>
  api(`/guilds/${guild.id}/stickers`, {
    token: dono.accessToken,
    body: { name: "gorda", relatedEmoji: "😅", url: "https://exemplo/g.png", size: 900 * 1024 },
  }),
);

console.log("\n== som ==");
const som = await api(`/guilds/${guild.id}/sounds`, {
  token: dono.accessToken,
  body: { name: "risada", emoji: "😂", url: "https://exemplo/som.mp3", volume: 0.8, size: 100 * 1024 },
});
ok(`som "${som.name}" criado com volume ${som.volume}`);

console.log("\n== lista para o seletor ==");
const tudo = await api(`/guilds/${guild.id}/expressions`, { token: ze.accessToken, method: "GET" });
if (tudo.emojis.length !== 1 || tudo.stickers.length !== 1 || tudo.sounds.length !== 1) {
  throw new Error("a lista de expressoes nao veio completa");
}
if (!tudo.emojis[0].createdBy) throw new Error("faltou quem enviou");
ok(`membro comum ve as tres listas, com quem enviou (${tudo.emojis[0].createdBy.displayName})`);

console.log("\n== apagar ==");
await api(`/guilds/${guild.id}/emojis/${emoji.id}`, { token: dono.accessToken, method: "DELETE" });
const depois = await api(`/guilds/${guild.id}/expressions`, { token: dono.accessToken, method: "GET" });
if (depois.emojis.length !== 0) throw new Error("o emoji apagado continua na lista");
ok("apagar tira da lista");

const registro = await api(`/guilds/${guild.id}/audit-log`, { token: dono.accessToken, method: "GET" });
const acoes = registro.entries.map((e) => e.action);
for (const esperada of ["emoji.create", "emoji.delete", "sticker.create", "sound.create"]) {
  if (!acoes.includes(esperada)) throw new Error(`a auditoria nao registrou ${esperada}`);
}
ok("cada expressao criada e apagada aparece no registro de auditoria");

await api(`/guilds/${guild.id}`, { token: dono.accessToken, method: "DELETE" });
console.log("\ntudo certo.");
