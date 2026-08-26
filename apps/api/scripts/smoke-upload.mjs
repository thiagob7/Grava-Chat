const BASE = "http://localhost:3333";

async function limpar(guildIds, token) {
  for (const id of guildIds.filter(Boolean)) {
    await fetch(`${BASE}/api/guilds/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => undefined);
  }
}
const ok = (m) => console.log(`  ok  ${m}`);

const api = async (path, { token, body, method = "POST" } = {}) => {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
};

const { accessToken } = await api("/auth/dev-login", { body: { email: "upload@gravae.io", displayName: "Upload" } });

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

console.log("\n== presign ==");
const { uploadUrl, attachment } = await api("/uploads/presign", {
  token: accessToken,
  body: { filename: "print da tela.png", contentType: "image/png", size: png.length },
});
if (!attachment.id.startsWith("gravae-chat/")) throw new Error(`chave sem prefixo: ${attachment.id}`);
ok(`chave namespaced: ${attachment.id.split("/").slice(0, 2).join("/")}/…`);
if (!attachment.id.includes("print_da_tela.png")) throw new Error("nome do arquivo nao foi sanitizado");
ok("nome com espaços foi sanitizado");

console.log("\n== upload direto no R2 ==");
const put = await fetch(uploadUrl, { method: "PUT", body: png, headers: { "Content-Type": "image/png" } });
if (!put.ok) throw new Error(`PUT falhou: ${put.status} ${await put.text()}`);
ok("navegador enviou direto pro R2 (o binário não passou pela API)");

console.log("\n== leitura pública ==");
const get = await fetch(attachment.url);
if (!get.ok) throw new Error(`GET publico falhou: ${get.status}`);
const bytes = Buffer.from(await get.arrayBuffer());
if (!bytes.equals(png)) throw new Error("o arquivo baixado difere do enviado");
ok(`arquivo lido de volta idêntico (${bytes.length} bytes, ${get.headers.get("content-type")})`);

console.log("\n== anexo numa mensagem ==");
const { io } = await import("socket.io-client");
const guild = await api("/guilds", { token: accessToken, body: { name: "Teste Anexo" } });
const detalhe = await api(`/guilds/${guild.id}`, { token: accessToken, method: "GET" });
const canal = detalhe.channels.find((c) => c.type === "TEXT");

const socket = io(BASE, { auth: { token: accessToken }, transports: ["websocket"] });
await new Promise((r) => socket.on("connect", r));
const emit = (ev, p) => new Promise((res, rej) => socket.emit(ev, p, (r) => (r.ok ? res(r.data) : rej(new Error(r.error)))));

await emit("channel:subscribe", { channelId: canal.id });
await emit("message:send", {
  channelId: canal.id,
  content: "olha esse print",
  attachments: [{ ...attachment, width: 1, height: 1 }],
});

const historico = await api(`/channels/${canal.id}/messages`, { token: accessToken, method: "GET" });
const comAnexo = historico.messages.find((m) => m.attachments.length > 0);
if (!comAnexo) throw new Error("mensagem voltou sem o anexo");
if (comAnexo.attachments[0].url !== attachment.url) throw new Error("url do anexo mudou");
if (comAnexo.attachments[0].width !== 1) throw new Error("dimensoes do anexo se perderam");
ok("mensagem com anexo persiste (url e dimensoes preservadas)");

await emit("message:send", { channelId: canal.id, content: "", attachments: [attachment] });
const depois = await api(`/channels/${canal.id}/messages`, { token: accessToken, method: "GET" });
if (depois.messages.filter((m) => m.attachments.length > 0).length !== 2) {
  throw new Error("mensagem so com anexo foi recusada");
}
ok("mensagem so com anexo (sem texto) e aceita");

try {
  await emit("message:send", { channelId: canal.id, content: "", attachments: [] });
  throw new Error("FALHOU: aceitou mensagem totalmente vazia");
} catch (e) {
  if (!/vazia/.test(e.message)) throw e;
  ok("mensagem sem texto E sem anexo continua sendo recusada");
}
socket.close();

console.log("\n== limite de tamanho ==");
try {
  await api("/uploads/presign", { token: accessToken, body: { filename: "gigante.zip", contentType: "application/zip", size: 999_999_999 } });
  throw new Error("FALHOU: aceitou arquivo acima do limite");
} catch (e) {
  if (!/400/.test(e.message)) throw e;
  ok("arquivo acima do limite é recusado antes de assinar");
}

await limpar([guild.id], accessToken);
console.log("\nUpload ok.\n");
