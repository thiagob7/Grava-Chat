/**
 * A plataforma do Gravaê Music — landing + painel de configuração.
 *
 * Roda FORA do Gravaê, como o site da Loritta. É o dev que hospeda, e é aqui
 * que ele inventa o que o bot faz: a plataforma não sabe o que é "prefixo" ou
 * "boas-vindas do bot" — quem sabe é este site, e quem obedece é o bot.
 *
 *   GRAVAE_CLIENT_ID=... GRAVAE_CLIENT_SECRET=... GRAVAE_BOT_TOKEN=... \
 *   node servidor.mjs
 *
 * Sem dependências: só o Node.
 */
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";

import { configuracoes, PADRAO } from "./config.mjs";
import * as paginas from "./paginas.mjs";

const CLIENT_ID = process.env.GRAVAE_CLIENT_ID;
const CLIENT_SECRET = process.env.GRAVAE_CLIENT_SECRET;
const BOT_TOKEN = process.env.GRAVAE_BOT_TOKEN;
const API = process.env.GRAVAE_API ?? "http://localhost:3333/api";
const APP = process.env.GRAVAE_APP ?? "http://localhost:5173";
const PORTA = Number(process.env.PORT ?? 8080);
const REDIRECT = `http://localhost:${PORTA}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Faltam GRAVAE_CLIENT_ID e GRAVAE_CLIENT_SECRET (aba OAuth2 do seu bot).");
  process.exit(1);
}

const LINK_DE_CONVITE = `${APP}/bots/${CLIENT_ID}/adicionar`;

/// Sessões e `state` em memória: se o processo cair, todo mundo entra de novo.
/// A CONFIGURAÇÃO, essa sim, vai pra disco — ela é o que não pode se perder.
const sessoes = new Map();
const pendentes = new Set();

const comToken = async (caminho, token, tipo = "Bearer") => {
  const r = await fetch(`${API}${caminho}`, { headers: { Authorization: `${tipo} ${token}` } });
  if (!r.ok) throw new Error(`${caminho} respondeu ${r.status}`);
  return r.json();
};

/**
 * Os canais do servidor, lidos com o token do BOT.
 *
 * O token do usuário não serve aqui: ele diz quem a pessoa é e onde ela manda,
 * não a estrutura de cada servidor. Quem enxerga canais é o bot, e só onde ele
 * foi adicionado — sem o bot lá dentro, o painel mostra a lista vazia e avisa.
 */
async function canaisDe(guildId) {
  if (!BOT_TOKEN) return [];

  return comToken(`/bot/servidores/${guildId}/canais`, BOT_TOKEN, "Bot")
    .then((canais) => canais.filter((c) => c.type === "TEXT"))
    .catch(() => []);
}

/**
 * Manda a mensagem de boas-vindas agora, no canal escolhido.
 *
 * É o "Salvar e testar" da aba. Usa a API REST do bot — o painel não abre
 * WebSocket nenhum, e não precisa: `POST` numa rota, com o token do bot no
 * cabeçalho, é tudo o que existe entre configurar e ver a mensagem no chat.
 *
 * O valor está no que ele descobre cedo: o bot sem permissão de escrever no
 * canal responde 403 aqui, na cara de quem está configurando, e não silêncio
 * no dia em que alguém entrar no servidor.
 */
async function testarBoasVindas(guild) {
  const config = configuracoes.de(guild.id);

  if (!BOT_TOKEN) return "Sem GRAVAE_BOT_TOKEN aqui: não dá para mandar o teste.";
  if (!config.boasVindasCanal) return "Salvo. Escolha um canal para poder testar.";

  /// As mesmas trocas que o bot faz de verdade, com você no lugar de quem
  /// entrou — testar com `{pessoa}` cru não mostraria como fica.
  const texto = (config.boasVindasTexto || "Bem-vindo, {pessoa}!")
    .replaceAll("{pessoa}", "@você")
    .replaceAll("{nome}", "você")
    .replaceAll("{servidor}", guild.name)
    .replaceAll("{prefixo}", config.prefixo);

  const r = await fetch(`${API}/bot/canais/${config.boasVindasCanal}/mensagens`, {
    method: "POST",
    headers: { Authorization: `Bot ${BOT_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: `🧪 Teste de boas-vindas — ${texto}` }),
  });

  if (r.ok) return "Salvo, e o teste foi para o canal. Olhe o chat.";

  if (r.status === 403) return "Salvo, mas o bot não pode escrever nesse canal.";
  if (r.status === 404) return "Salvo, mas o bot não está nesse servidor.";

  return `Salvo, mas o teste falhou (${r.status}).`;
}

const corpoDoFormulario = (req) =>
  new Promise((ok) => {
    let dados = "";
    req.on("data", (p) => (dados += p));
    req.on("end", () => ok(new URLSearchParams(dados)));
  });

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  const cookie = /sessao=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
  const sessao = cookie ? sessoes.get(cookie) : null;

  const enviar = (html, extra = {}) =>
    res.writeHead(200, { "content-type": "text/html; charset=utf-8", ...extra }).end(html);

  const irPara = (destino, extra = {}) => res.writeHead(302, { location: destino, ...extra }).end();

  try {
    // ── a capa ──────────────────────────────────────────────────────────
    if (url.pathname === "/") {
      return enviar(
        paginas.landing({ usuario: sessao?.nome ?? null, linkDeConvite: LINK_DE_CONVITE }),
      );
    }

    // ── login ───────────────────────────────────────────────────────────
    if (url.pathname === "/entrar") {
      const state = randomBytes(16).toString("hex");
      pendentes.add(state);

      const autorizar = new URL(`${APP}/oauth2/autorizar`);
      autorizar.searchParams.set("client_id", CLIENT_ID);
      autorizar.searchParams.set("redirect_uri", REDIRECT);
      autorizar.searchParams.set("scope", "identify guilds");
      autorizar.searchParams.set("state", state);

      return irPara(autorizar.toString());
    }

    if (url.pathname === "/sair") {
      if (cookie) sessoes.delete(cookie);
      return irPara("/", { "set-cookie": "sessao=; Path=/; Max-Age=0" });
    }

    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      /// O `state` prova que este login começou AQUI. Sem ele, alguém induz a
      /// vítima a terminar um login que não é dela.
      if (!code || !state || !pendentes.delete(state)) {
        return enviar(paginas.erro("Login inválido", "O código de segurança não confere."));
      }

      const r = await fetch(`${API}/oauth2/token`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code,
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          redirect_uri: REDIRECT,
        }),
      });

      if (!r.ok) {
        return enviar(paginas.erro("Não deu pra entrar", "A troca do código falhou."));
      }

      const { access_token } = await r.json();
      const usuario = await comToken("/oauth2/usuario", access_token);

      const id = randomBytes(16).toString("hex");
      sessoes.set(id, { token: access_token, nome: usuario.displayName });

      return irPara("/painel", { "set-cookie": `sessao=${id}; HttpOnly; Path=/; SameSite=Lax` });
    }

    // ── daqui pra baixo, precisa estar logado ───────────────────────────
    if (url.pathname.startsWith("/painel")) {
      if (!sessao) return enviar(paginas.precisaEntrar());

      const servidores = await comToken("/oauth2/servidores", sessao.token);
      const partes = url.pathname.split("/").filter(Boolean); // painel / <id> / <secao>

      if (partes.length === 1) {
        return enviar(
          paginas.listaDeServidores({
            usuario: sessao.nome,
            servidores,
            linkDeConvite: LINK_DE_CONVITE,
          }),
        );
      }

      const guild = servidores.find((g) => g.id === partes[1]);

      /// Gerenciar é o que decide. Estar no servidor não basta — senão
      /// qualquer membro configuraria o bot do servidor dos outros.
      if (!guild?.gerencia) {
        return enviar(
          paginas.erro("Sem permissão", "Você não gerencia esse servidor, ou ele não existe."),
        );
      }

      const secao = partes[2] ?? "geral";
      let salvo = false;
      let recado = null;

      if (req.method === "POST") {
        const form = await corpoDoFormulario(req);
        const mudancas = {};

        /// Só os campos QUE VIERAM nesta seção. Espalhar o formulário inteiro
        /// apagaria o que a outra aba configurou, porque um `checkbox`
        /// desmarcado simplesmente não é enviado.
        for (const [campo, padrao] of Object.entries(PADRAO)) {
          if (typeof padrao === "boolean") {
            if (form.has(campo) || form.has(`${campo}__presente`)) {
              mudancas[campo] = form.get(campo) === "on";
            }
            continue;
          }

          if (!form.has(campo)) continue;

          mudancas[campo] =
            typeof padrao === "number" ? Number(form.get(campo)) || padrao : form.get(campo);
        }

        configuracoes.salvar(guild.id, mudancas);
        salvo = true;

        if (form.get("acao") === "testar") recado = await testarBoasVindas(guild);
      }

      return enviar(
        paginas.painelDoServidor({
          usuario: sessao.nome,
          guild,
          secao,
          config: configuracoes.de(guild.id),
          canais: await canaisDe(guild.id),
          salvo,
          recado,
        }),
      );
    }

    // ── o que o BOT lê ──────────────────────────────────────────────────
    /*
      É por aqui que a configuração vira comportamento: o bot pergunta, antes
      de agir, como este servidor quer ser tratado. Sem esta rota, o painel
      seria só um formulário bonito que não muda nada.
    */
    if (url.pathname.startsWith("/api/config/")) {
      const guildId = url.pathname.split("/").pop();
      return res
        .writeHead(200, { "content-type": "application/json" })
        .end(JSON.stringify(configuracoes.de(guildId)));
    }

    res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
    res.end(paginas.erro("Não achei essa página", "O endereço não existe por aqui."));
  } catch (erro) {
    console.error(erro);
    res.writeHead(500, { "content-type": "text/html; charset=utf-8" });
    res.end(paginas.erro("Deu ruim", erro.message));
  }
}).listen(PORTA, () => {
  console.log(`\n  ${paginas.NOME} no ar: http://localhost:${PORTA}`);
  console.log(`  convite: ${LINK_DE_CONVITE}`);
  if (!BOT_TOKEN) console.log("  (sem GRAVAE_BOT_TOKEN: a lista de canais fica vazia)\n");
  else console.log("");
});
