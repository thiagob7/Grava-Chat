import { has } from "@gravae/shared";
import { ForbiddenError } from "~/lib/http.js";
import { violation } from "~/lib/automod.js";
import { autoModRepository } from "~/repositories/automod-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import type { Context } from "./access-service.js";

export const autoModService = {
  async evaluate(params: {
    guildId: string;
    channelId: string;
    userId: string;
    context: Context;
    content: string;
  }) {
    const { guildId, context, content, userId } = params;

    if (context.isOwner || has(context.permissions, "ADMINISTRATOR")) return;

    const rules = await autoModRepository.findEnabledByGuild(guildId);
    if (!rules.length) return;

    const mineRoles = new Set(context.roles.map((r) => r.id));

    for (const rule of rules) {
      if (rule.rolesExempt.some((id) => mineRoles.has(id))) continue;

      const reason = violation(content, {
        trigger: rule.trigger,
        words: rule.words,
        limitMentions: rule.limitMentions,
      });

      if (!reason) continue;

      if (rule.actions.includes("TIMEOUT") && rule.timeoutSeconds) {
        void memberRepository
          .setTimeout(guildId, userId, new Date(Date.now() + rule.timeoutSeconds * 1000))
          .catch(() => undefined);
      }

      if (rule.actions.includes("ALERT") && rule.alertChannelId) {
        void autoModService
          .notify(rule.alertChannelId, params, rule.name, reason)
          .catch(() => undefined);
      }

      if (rule.actions.includes("BLOCK")) {
        throw new ForbiddenError(`Bloqueado pelo AutoMod (${rule.name}): ${reason}`).having("automod");
      }
    }
  },

  async notify(
    alertChannelId: string,
    params: { userId: string; channelId: string; content: string },
    rule: string,
    reason: string,
  ) {
    const { messageRepository } = await import("~/repositories/message-repository.js");
    const snippet = params.content.slice(0, 200);

    await messageRepository.create({
      channelId: alertChannelId,
      authorId: params.userId,
      kind: "JOIN",
      content: `🛡️ **AutoMod — ${rule}**: mensagem de <@${params.userId}> em <#${params.channelId}> bloqueada (${reason}).\n> ${snippet}`,
      attachments: [],
      replyToId: null,
      mentions: [],
    });
  },
};
