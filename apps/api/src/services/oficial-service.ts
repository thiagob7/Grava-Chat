import type { FastifyBaseLogger } from "fastify";

import { THEME_PATH } from "@gravae/shared";

import { env } from "~/env.js";
import { keys, redis } from "~/lib/redis.js";
import { systemService } from "~/services/sistema-service.js";

const WINDOW_S = 10 * 60;

const house = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

interface Notice {
  title: string;
  body: string;
  action?: { label: string; path: string };
}

export const TEMPLATES = {
  themePublished: (data: { name: string; themeId: string }): Notice => ({
    title: "Tema publicado",
    body: `Seu tema “${data.name}” está no ar. O link abaixo vira um cartão de importar em qualquer canal.`,
    action: { label: "Ver o tema", path: `${THEME_PATH}${data.themeId}` },
  }),

  verifiedCommunity: (data: { name: string }): Notice => ({
    title: "Comunidade verificada",
    body: `A comunidade “${data.name}” foi verificada. O selo já aparece ao lado do nome dela.`,
  }),

  communityWithoutSeal: (data: { name: string }): Notice => ({
    title: "Verificação retirada",
    body: `A verificação da comunidade “${data.name}” foi retirada.`,
  }),

  passwordSwapped: (): Notice => ({
    title: "Senha alterada",
    body:
      "A senha da sua conta acabou de mudar, e as sessões que estavam abertas foram encerradas. Se não foi você, troque a senha de novo agora.",
    action: { label: "Ver a segurança da conta", path: "/configuracoes/conta" },
  }),

  emailConfirmed: (): Notice => ({
    title: "E-mail confirmado",
    body:
      "Seu e-mail está confirmado. Agora você fala em qualquer comunidade que exija isso para escrever.",
  }),

  newDevice: (data: { device: string }): Notice => ({
    title: "Entrada de um aparelho novo",
    body: `Alguém entrou na sua conta por ${data.device}. Se não foi você, encerre as outras sessões e troque a senha.`,
    action: { label: "Ver a segurança da conta", path: "/configuracoes/conta" },
  }),
} as const;

export type NoticeKind = keyof typeof TEMPLATES;

function write(notice: Notice) {
  const lines = [notice.title, "", notice.body];

  if (notice.action) lines.push("", `${notice.action.label}: ${house()}${notice.action.path}`);

  lines.push("", "O Gravaê nunca pede a sua senha nem o token da sua conta.");

  return lines.join("\n");
}

export const officialService = {
  async notify<T extends NoticeKind>(
    userId: string,
    kind: T,
    data: Parameters<(typeof TEMPLATES)[T]>[0],
    options: { key?: string; log?: FastifyBaseLogger } = {},
  ) {
    const key = options.key ?? `${kind}:${userId}`;

    const first = await redis
      .set(keys.officialNotice(key), "1", "EX", WINDOW_S, "NX")
      .catch(() => "OK");

    if (!first) return false;

    const template = TEMPLATES[kind] as (entry: typeof data) => Notice;

    await systemService.notify(userId, write(template(data)), options.log);

    return true;
  },
};
