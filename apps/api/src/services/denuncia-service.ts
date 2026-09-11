import type { FastifyBaseLogger } from "fastify";

import { AppError, NotFoundError } from "~/lib/http.js";
import { ADMINS } from "~/lib/serialize.js";
import { env } from "~/env.js";
import { prisma } from "~/lib/prisma.js";
import { sendMessage } from "~/realtime/difusao.js";
import { botRepository } from "~/repositories/bot-repository.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { guildRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { systemService } from "~/services/sistema-service.js";

export const REPORT_REASONS = ["spam", "assedio", "conteudo", "golpe", "outro"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

const REASON_NAME: Record<ReportReason, string> = {
  spam: "Spam ou propaganda",
  assedio: "Assédio ou ódio",
  conteudo: "Conteúdo impróprio",
  golpe: "Golpe ou fraude",
  outro: "Outro",
};

const SNIPPET = 300;

const web = () => env.WEB_ORIGIN.split(",")[0]?.trim() ?? "";

async function notifyAdmins(text: string, log?: FastifyBaseLogger) {
  const house = await systemService.user();

  for (const email of ADMINS) {
    try {
      const admin = await userRepository.findByEmail(email);
      if (!admin || admin.id === house.id) continue;

      const channel =
        (await dmRepository.findBetween(house.id, admin.id)) ?? (await dmRepository.create([house.id, admin.id]));

      await sendMessage(house.id, { channelId: channel.id, content: text });
    } catch (err) {
      log?.error({ err }, `denúncia: não deu para avisar ${email}`);
    }
  }
}

export interface ReportQueue {
  id: string;
  kind: "comunidade" | "mensagem";
  reason: ReportReason;
  reasonWritten: string;
  details: string | null;
  createdAt: string;
  resolvedAt: string | null;
  decision: string | null;
  author: { id: string; username: string; displayName: string } | null;
  community: { id: string; name: string } | null;
  message: {
    id: string;
    channelId: string;
    guildId: string | null;
    snippet: string;
    author: { id: string; username: string; displayName: string } | null;
  } | null;
}

export const reportService = {
  async reportApp(
    userId: string,
    botId: string,
    data: { reason: ReportReason; details?: string },
    log?: FastifyBaseLogger,
  ) {
    const bot = await botRepository.findPublicById(botId);
    if (!bot) throw new NotFoundError("Aplicativo não encontrado");

    const author = await userRepository.findByIdOrThrow(userId);

    const report = await prisma.report.create({
      data: {
        kind: "aplicativo",
        accusedId: bot.botUserId,
        authorId: userId,
        reason: data.reason,
        details: data.details ?? null,
      },
    });

    await notifyAdmins(
      [
        `**Denúncia de aplicativo** — ${REASON_NAME[data.reason]}`,
        `Aplicativo: **${bot.user.displayName}** (\`${bot.id}\`)`,
        `Quem denunciou: **${author.displayName}** (@${author.username})`,
        data.details ? `Detalhes: ${data.details}` : null,
        `${web()}/admin/denuncias`,
      ]
        .filter(Boolean)
        .join("\n"),
      log,
    );

    return report;
  },

  async reportServer(
    userId: string,
    guildId: string,
    data: { reason: ReportReason; details?: string },
    log?: FastifyBaseLogger,
  ) {
    await accessService.requireMember(userId, guildId);
    const guild = await guildRepository.findByIdOrThrow(guildId);
    const author = await userRepository.findByIdOrThrow(userId);

    const report = await prisma.report.create({
      data: { guildId, authorId: userId, reason: data.reason, details: data.details ?? null },
    });

    await notifyAdmins(
      [
        `Denúncia de comunidade: ${guild.name} (${guild.id})`,
        `Motivo: ${REASON_NAME[data.reason]}`,
        data.details ? `Detalhes: ${data.details}` : null,
        `Por @${author.username} (${author.id})`,
      ]
        .filter(Boolean)
        .join("\n"),
      log,
    );

    return { id: report.id };
  },

  async list(filter: { pending?: boolean; before?: string; limit?: number } = {}) {
    const limit = Math.min(filter.limit ?? 50, 100);

    const reports = await prisma.report.findMany({
      where: {
        ...(filter.pending ? { resolvedAt: null } : {}),
        ...(filter.before ? { id: { lt: filter.before } } : {}),
      },
      orderBy: { id: "desc" },
      take: limit + 1,
    });

    const hasMore = reports.length > limit;
    const page = hasMore ? reports.slice(0, limit) : reports;

    const folksIds = [
      ...new Set(page.flatMap((d) => [d.authorId, d.accusedId].filter(Boolean) as string[])),
    ];
    const serverIds = [...new Set(page.map((d) => d.guildId).filter(Boolean) as string[])];

    const [folks, servers] = await Promise.all([
      folksIds.length ? userRepository.findManyByIds(folksIds) : [],
      serverIds.length ? guildRepository.findManyByIds(serverIds) : [],
    ]);

    const who = new Map(folks.map((u) => [u.id, { id: u.id, username: u.username, displayName: u.displayName }]));
    const where = new Map(servers.map((g) => [g.id, g]));

    const items: ReportQueue[] = page.map((d) => {
      const isMessage = d.kind === "mensagem";
      const server = d.guildId ? where.get(d.guildId) : null;

      return {
        id: d.id,
        kind: isMessage ? "mensagem" : "comunidade",
        reason: d.reason as ReportReason,
        reasonWritten: REASON_NAME[d.reason as ReportReason] ?? d.reason,
        details: d.details,
        createdAt: d.createdAt.toISOString(),
        resolvedAt: d.resolvedAt?.toISOString() ?? null,
        decision: d.decision,
        author: who.get(d.authorId) ?? null,
        community: server ? { id: server.id, name: server.name } : null,
        message:
          isMessage && d.messageId && d.channelId
            ? {
                id: d.messageId,
                channelId: d.channelId,
                guildId: d.guildId,
                snippet: d.snippet ?? "",
                author: d.accusedId ? (who.get(d.accusedId) ?? null) : null,
              }
            : null,
      };
    });

    return { items, next: hasMore ? (page.at(-1)?.id ?? null) : null };
  },

  async resolve(adminId: string, reportId: string, decision: "procede" | "arquivada") {
    const existing = await prisma.report.findUnique({ where: { id: reportId } });
    if (!existing) throw new NotFoundError("Denúncia não encontrada");

    await prisma.report.update({
      where: { id: reportId },
      data: { resolvedAt: new Date(), resolvedBy: adminId, decision },
    });

    return { id: reportId, decision };
  },

  async reopen(reportId: string) {
    await prisma.report.update({
      where: { id: reportId },
      data: { resolvedAt: null, resolvedBy: null, decision: null },
    });

    return { id: reportId };
  },

  async reportMessage(
    userId: string,
    messageId: string,
    data: { reason: ReportReason; details?: string },
    log?: FastifyBaseLogger,
  ) {
    const message = await messageRepository.findById(messageId);
    if (!message || message.deletedAt) throw new NotFoundError("Mensagem não encontrada");

    const { channel } = await accessService.requireChannelAccess(userId, message.channelId);

    if (message.authorId === userId) throw new AppError("Não dá para denunciar a própria mensagem");

    const house = await systemService.user();
    if (message.authorId === house.id) throw new AppError("Não dá para denunciar a conta do sistema");

    const author = await userRepository.findByIdOrThrow(userId);
    const accused = await userRepository.findByIdOrThrow(message.authorId);
    const snippet = message.content.slice(0, SNIPPET);

    const report = await prisma.report.create({
      data: {
        kind: "mensagem",
        guildId: channel.guildId,
        channelId: channel.id,
        messageId: message.id,
        accusedId: accused.id,
        snippet,
        authorId: userId,
        reason: data.reason,
        details: data.details ?? null,
      },
    });

    const guild = channel.guildId ? await guildRepository.findByIdOrThrow(channel.guildId) : null;
    const where = guild ? `${guild.name} › #${channel.name ?? channel.id}` : "conversa privada";

    await notifyAdmins(
      [
        `Denúncia de mensagem em ${where}`,
        `Motivo: ${REASON_NAME[data.reason]}`,
        data.details ? `Detalhes: ${data.details}` : null,
        `De @${accused.username} (${accused.id}): ${snippet || "(sem texto)"}`,
        `Por @${author.username} (${author.id})`,
        `${web()}/channels/${channel.guildId ?? "@me"}/${channel.id}/${message.id}`,
      ]
        .filter(Boolean)
        .join("\n"),
      log,
    );

    return { id: report.id };
  },
};
