import type { Prisma } from "@prisma/client";
import { auditRepository } from "~/repositories/audit-repository.js";
import { toPublicUser } from "~/lib/serialize.js";
import { accessService } from "./access-service.js";

/**
 * O registro de auditoria é um efeito colateral, nunca um pré-requisito: se
 * gravar falhar, a ação que a pessoa pediu já aconteceu e não pode ser desfeita
 * por causa do log. Por isso `registrar` engole o próprio erro.
 */
export interface EntradaDeAuditoria {
  guildId: string;
  actorId: string;
  /** "role.create", "member.ban", "channel.update"… sempre alvo.verbo */
  action: string;
  targetType: string;
  targetId?: string;
  /** nome no momento da ação — o alvo pode ser apagado depois */
  targetName?: string;
  changes?: Record<string, { de: unknown; para: unknown }>;
  reason?: string;
}

/** Diferença campo a campo, só do que mudou de verdade. */
export function diferenca<T extends Record<string, unknown>>(antes: T, depois: Partial<T>) {
  const changes: Record<string, { de: unknown; para: unknown }> = {};

  for (const [campo, valor] of Object.entries(depois)) {
    if (valor === undefined) continue;

    const anterior = antes[campo];
    const igual = Array.isArray(valor)
      ? JSON.stringify(anterior) === JSON.stringify(valor)
      : anterior === valor;

    if (!igual) changes[campo] = { de: anterior ?? null, para: valor };
  }

  return Object.keys(changes).length ? changes : undefined;
}

export const auditService = {
  registrar(entrada: EntradaDeAuditoria) {
    void auditRepository
      .create({ ...entrada, changes: (entrada.changes ?? undefined) as Prisma.InputJsonValue })
      .catch(() => undefined);
  },

  async list(
    userId: string,
    guildId: string,
    params: { actorId?: string; action?: string; limit: number; before?: string },
  ) {
    await accessService.requirePermission(userId, guildId, "VIEW_AUDIT_LOG");

    const entradas = await auditRepository.findPage({ guildId, ...params });

    return {
      entries: entradas.map((e) => ({
        id: e.id,
        actor: toPublicUser(e.actor),
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        targetName: e.targetName,
        changes: (e.changes ?? null) as Record<string, { de: unknown; para: unknown }> | null,
        reason: e.reason,
        createdAt: e.createdAt.toISOString(),
      })),
      hasMore: entradas.length === params.limit,
    };
  },
};
