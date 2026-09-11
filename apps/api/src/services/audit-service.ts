import type { Prisma } from "@prisma/client";
import { auditRepository } from "~/repositories/audit-repository.js";
import { toPublicUser } from "~/lib/serialize.js";
import { accessService } from "./access-service.js";

export interface AuditEntry {
  guildId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  changes?: Record<string, { de: unknown; toward: unknown }>;
  reason?: string;
}

export function difference<T extends Record<string, unknown>>(before: T, after: Partial<T>) {
  const changes: Record<string, { de: unknown; toward: unknown }> = {};

  for (const [field, value] of Object.entries(after)) {
    if (value === undefined) continue;

    const anterior = before[field];
    const equal = Array.isArray(value)
      ? JSON.stringify(anterior) === JSON.stringify(value)
      : anterior === value;

    if (!equal) changes[field] = { de: anterior ?? null, toward: value };
  }

  return Object.keys(changes).length ? changes : undefined;
}

export const auditService = {
  register(entry: AuditEntry) {
    void auditRepository
      .create({ ...entry, changes: (entry.changes ?? undefined) as Prisma.InputJsonValue })
      .catch(() => undefined);
  },

  async list(
    userId: string,
    guildId: string,
    params: { actorId?: string; action?: string; limit: number; before?: string },
  ) {
    await accessService.requirePermission(userId, guildId, "VIEW_AUDIT_LOG");

    const entries = await auditRepository.findPage({ guildId, ...params });

    return {
      entries: entries.map((e) => ({
        id: e.id,
        actor: toPublicUser(e.actor),
        action: e.action,
        targetType: e.targetType,
        targetId: e.targetId,
        targetName: e.targetName,
        changes: (e.changes ?? null) as Record<string, { de: unknown; toward: unknown }> | null,
        reason: e.reason,
        createdAt: e.createdAt.toISOString(),
      })),
      hasMore: entries.length === params.limit,
    };
  },
};
