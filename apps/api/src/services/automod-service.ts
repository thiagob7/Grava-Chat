import { has } from "@gravae/shared";
import { ForbiddenError } from "~/lib/http.js";
import { violacao } from "~/lib/automod.js";
import { autoModRepository } from "~/repositories/automod-repository.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import type { Contexto } from "./access-service.js";

/**
 * O AutoMod roda ANTES de gravar a mensagem. Bloquear depois significaria a
 * mensagem existir por um instante — e em tempo real "um instante" é o
 * suficiente para todo mundo ler.
 */
export const autoModService = {
  async avaliar(params: {
    guildId: string;
    channelId: string;
    userId: string;
    contexto: Contexto;
    content: string;
  }) {
    const { guildId, contexto, content, userId } = params;

    // quem administra o servidor não é moderado pelo próprio filtro
    if (contexto.isOwner || has(contexto.permissions, "ADMINISTRATOR")) return;

    const regras = await autoModRepository.findEnabledByGuild(guildId);
    if (!regras.length) return;

    const meusCargos = new Set(contexto.roles.map((r) => r.id));

    for (const regra of regras) {
      if (regra.cargosIsentos.some((id) => meusCargos.has(id))) continue;

      const motivo = violacao(content, {
        trigger: regra.trigger,
        palavras: regra.palavras,
        limiteMencoes: regra.limiteMencoes,
      });

      if (!motivo) continue;

      // castigo e aviso são efeitos colaterais: não podem atrasar a resposta
      if (regra.acoes.includes("TIMEOUT") && regra.timeoutSeconds) {
        void memberRepository
          .setTimeout(guildId, userId, new Date(Date.now() + regra.timeoutSeconds * 1000))
          .catch(() => undefined);
      }

      if (regra.acoes.includes("ALERT") && regra.alertChannelId) {
        void autoModService
          .avisar(regra.alertChannelId, params, regra.name, motivo)
          .catch(() => undefined);
      }

      if (regra.acoes.includes("BLOCK")) {
        throw new ForbiddenError(`Bloqueado pelo AutoMod (${regra.name}): ${motivo}`);
      }
    }
  },

  /** O aviso é uma mensagem do sistema no canal escolhido. */
  async avisar(
    alertChannelId: string,
    params: { userId: string; channelId: string; content: string },
    regra: string,
    motivo: string,
  ) {
    const { messageRepository } = await import("~/repositories/message-repository.js");
    const trecho = params.content.slice(0, 200);

    await messageRepository.create({
      channelId: alertChannelId,
      authorId: params.userId,
      tipo: "JOIN",
      content: `🛡️ **AutoMod — ${regra}**: mensagem de <@${params.userId}> em <#${params.channelId}> bloqueada (${motivo}).\n> ${trecho}`,
      attachments: [],
      replyToId: null,
      mentions: [],
    });
  },
};
