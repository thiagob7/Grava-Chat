import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { env, isDev } from "~/env.js";

/// Cada grupo vira uma aba na tela do Swagger. A chave é o primeiro pedaço
/// do caminho depois do /api.
const GRUPOS: Record<string, { nome: string; descricao: string }> = {
  auth: { nome: "Autenticação", descricao: "Entrar, sair e renovar a sessão." },
  me: { nome: "Minha conta", descricao: "Perfil, preferências e dados de quem está logado." },
  users: { nome: "Pessoas", descricao: "Perfis públicos e notas." },
  friends: { nome: "Amizades", descricao: "Pedidos, bloqueios e conversas privadas." },
  guilds: { nome: "Servidores", descricao: "Servidores, canais, categorias e cargos." },
  invites: { nome: "Convites", descricao: "Criar, ver e aceitar convite." },
  descobrir: { nome: "Explorar", descricao: "Comunidades abertas a partir de cem membros." },
  temas: { nome: "Temas", descricao: "Publicar e buscar tema do estúdio." },
  messages: { nome: "Mensagens", descricao: "Enviar, editar, apagar, fixar e reagir." },
  channels: { nome: "Canais", descricao: "Histórico, fixadas e leitura." },
  forum: { nome: "Fórum", descricao: "Posts e respostas." },
  voice: { nome: "Voz", descricao: "Entrar na chamada, estado e token do LiveKit." },
  uploads: { nome: "Envios", descricao: "Anexos e imagens." },
  gifs: { nome: "GIFs", descricao: "Busca e favoritos." },
  embeds: { nome: "Prévias", descricao: "A leitura de um link para virar cartão." },
  bots: { nome: "Bots (dono)", descricao: "Criar e configurar aplicativo. Pede sessão." },
  bot: { nome: "Bots (API)", descricao: "O que um bot chama com o próprio token." },
  oauth2: { nome: "OAuth2", descricao: "Autorizar e trocar código por token." },
  webhooks: { nome: "Webhooks", descricao: "Criar, listar e disparar." },
  dms: { nome: "Amizades", descricao: "Pedidos, bloqueios e conversas privadas." },
  posts: { nome: "Fórum", descricao: "Posts e respostas." },
  moderation: { nome: "Moderação", descricao: "Castigo, expulsão, banimento e auditoria." },
  status: { nome: "Status", descricao: "Saúde do serviço e das máquinas." },
  publico: { nome: "Status público", descricao: "O que responde sem sessão nenhuma." },
  health: { nome: "Status", descricao: "Saúde do serviço e das máquinas." },
};

const VERBOS: Record<string, string> = {
  GET: "Lê",
  POST: "Cria",
  PUT: "Define",
  PATCH: "Muda",
  DELETE: "Remove",
};

const semPrefixo = (url: string) => url.replace(/^\/api(?=\/|$)/, "");

function grupoDe(url: string): string {
  const pedaco = semPrefixo(url).replace(/^\//, "").split("/")[0] ?? "";

  return GRUPOS[pedaco]?.nome ?? "Outras";
}

/// Um resumo automático, para a rota não aparecer só com o caminho cru. É
/// grosseiro de propósito: melhor um resumo pobre em 177 rotas do que um
/// bom em doze e nada no resto.
function resumoDe(metodo: string, url: string): string {
  const alvo = semPrefixo(url)
    .replace(/^\//, "")
    .split("/")
    .filter((pedaco) => !pedaco.startsWith(":"))
    .pop();

  return `${VERBOS[metodo] ?? metodo} ${alvo ?? url}`;
}

export const swaggerPlugin = fp(async (app) => {
  await app.register(swagger, {
    /// O transform roda para toda rota que entra na especificação, inclusive
    /// as que outros plugins criam por dentro — o onRoute não alcançava a do
    /// login com o Google, por exemplo.
    transform: ({ schema, url, route }) => {
      const metodos = Array.isArray(route?.method) ? route.method : [route?.method];
      const metodo = String(metodos[0] ?? "GET");

      return {
        url,
        schema: {
          ...schema,
          tags: schema?.tags?.length ? schema.tags : [grupoDe(url)],
          summary: schema?.summary ?? resumoDe(metodo, url),
          security:
            schema?.security ??
            (semPrefixo(url).startsWith("/bot/") ? [{ bot: [] }] : [{ sessao: [] }]),
        },
      };
    },
    openapi: {
      info: {
        title: "API do Gravaê Chat",
        description:
          "A API que o próprio app usa. A maior parte das rotas pede a sessão em cookie; " +
          "as de `/api/bot/*` pedem o token do aplicativo no cabeçalho `Authorization: Bot <token>`.",
        version: "1.0.0",
      },
      servers: [{ url: env.API_PUBLIC_URL }],
      components: {
        securitySchemes: {
          sessao: {
            type: "apiKey",
            in: "cookie",
            name: "gravae_session",
            description: "O cookie que o /api/auth deixa depois de entrar.",
          },
          bot: {
            type: "http",
            scheme: "bearer",
            description: "O token do aplicativo, como `Authorization: Bot <token>`.",
          },
        },
      },
      tags: Object.values(GRUPOS)
        .filter(
          (grupo, indice, todos) => todos.findIndex((o) => o.nome === grupo.nome) === indice,
        )
        .map((grupo) => ({ name: grupo.nome, description: grupo.descricao })),
    },
  });

  if (!isDev && !env.DOCS_ABERTAS) return;

  await app.register(swaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: { docExpansion: "list", deepLinking: true, tagsSorter: "alpha" },
  });
});
