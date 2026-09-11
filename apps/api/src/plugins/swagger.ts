import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import { env, isDev } from "~/env.js";

const GROUPS: Record<string, { name: string; description: string }> = {
  auth: { name: "Autenticação", description: "Entrar, sair e renovar a sessão." },
  me: { name: "Minha conta", description: "Perfil, preferências e dados de quem está logado." },
  users: { name: "Pessoas", description: "Perfis públicos e notas." },
  friends: { name: "Amizades", description: "Pedidos, bloqueios e conversas privadas." },
  guilds: { name: "Servidores", description: "Servidores, canais, categorias e cargos." },
  invites: { name: "Convites", description: "Criar, ver e aceitar convite." },
  discover: { name: "Explorar", description: "Comunidades abertas a partir de cem membros." },
  themes: { name: "Temas", description: "Publicar e buscar tema do estúdio." },
  messages: { name: "Mensagens", description: "Enviar, editar, apagar, fixar e reagir." },
  channels: { name: "Canais", description: "Histórico, fixadas e leitura." },
  forum: { name: "Fórum", description: "Posts e respostas." },
  voice: { name: "Voz", description: "Entrar na chamada, estado e token do LiveKit." },
  uploads: { name: "Envios", description: "Anexos e imagens." },
  gifs: { name: "GIFs", description: "Busca e favoritos." },
  embeds: { name: "Prévias", description: "A leitura de um link para virar cartão." },
  bots: { name: "Bots (dono)", description: "Criar e configurar aplicativo. Pede sessão." },
  bot: { name: "Bots (API)", description: "O que um bot chama com o próprio token." },
  oauth2: { name: "OAuth2", description: "Autorizar e trocar código por token." },
  webhooks: { name: "Webhooks", description: "Criar, listar e disparar." },
  dms: { name: "Amizades", description: "Pedidos, bloqueios e conversas privadas." },
  posts: { name: "Fórum", description: "Posts e respostas." },
  moderation: { name: "Moderação", description: "Castigo, expulsão, banimento e auditoria." },
  status: { name: "Status", description: "Saúde do serviço e das máquinas." },
  isPublic: { name: "Status público", description: "O que responde sem sessão nenhuma." },
  health: { name: "Status", description: "Saúde do serviço e das máquinas." },
};

const VERBS: Record<string, string> = {
  GET: "Lê",
  POST: "Cria",
  PUT: "Define",
  PATCH: "Muda",
  DELETE: "Remove",
};

const withoutPrefix = (url: string) => url.replace(/^\/api(?=\/|$)/, "");

function group(url: string): string {
  const piece = withoutPrefix(url).replace(/^\//, "").split("/")[0] ?? "";

  return GROUPS[piece]?.name ?? "Outras";
}

function summary(method: string, url: string): string {
  const target = withoutPrefix(url)
    .replace(/^\//, "")
    .split("/")
    .filter((piece) => !piece.startsWith(":"))
    .pop();

  return `${VERBS[method] ?? method} ${target ?? url}`;
}

export const swaggerPlugin = fp(async (app) => {
  await app.register(swagger, {
    transform: ({ schema, url, route }) => {
      const methods = Array.isArray(route?.method) ? route.method : [route?.method];
      const method = String(methods[0] ?? "GET");

      return {
        url,
        schema: {
          ...schema,
          tags: schema?.tags?.length ? schema.tags : [group(url)],
          summary: schema?.summary ?? summary(method, url),
          security:
            schema?.security ??
            (withoutPrefix(url).startsWith("/bot/") ? [{ bot: [] }] : [{ session: [] }]),
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
          session: {
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
      tags: Object.values(GROUPS)
        .filter(
          (group, index, all) => all.findIndex((o) => o.name === group.name) === index,
        )
        .map((group) => ({ name: group.name, description: group.description })),
    },
  });

  if (!isDev && !env.DOCS_ISOPEN) return;

  await app.register(swaggerUi, {
    routePrefix: "/api/docs",
    uiConfig: { docExpansion: "list", deepLinking: true, tagsSorter: "alpha" },
  });
});
