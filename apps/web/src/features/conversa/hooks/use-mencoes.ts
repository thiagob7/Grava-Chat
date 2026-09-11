import { useCallback, useMemo } from "react";
import type { Role } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";

export interface Mentionable {
  text: string;
  id: string;
  kind: "usuario" | "cargo" | "todos";
  name: string;
  detail?: string;
  avatarUrl?: string | null;
  color?: string | null;
}

export function useMentions(
  guildId: string | undefined,
  canMentionAll = false,
  currentUserId?: string,
) {
  const { data: detail } = useFindGuild(guildId);

  const list = useMemo<Mentionable[]>(() => {
    if (!detail) return [];

    const people: Mentionable[] = detail.members.map((m) => ({
      text: `<@${m.user.id}>`,
      id: m.user.id,
      kind: "usuario",
      name: m.nickname ?? m.user.displayName,
      detail: m.user.username,
      avatarUrl: m.user.avatarUrl,
    }));

    const roleList: Mentionable[] = detail.roles
      .filter((r) => !r.isEveryone && (canMentionAll || r.mentionable))
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        text: `<@&${r.id}>`,
        id: r.id,
        kind: "cargo",
        name: r.name,
        color: r.color,
      }));

    const all: Mentionable[] = canMentionAll
      ? [
          { text: "@everyone", id: "everyone", kind: "todos", name: "everyone", detail: "Notifica todo mundo do servidor" },
          { text: "@here", id: "here", kind: "todos", name: "here", detail: "Notifica só quem está online" },
        ]
      : [];

    return [...all, ...roleList, ...people];
  }, [detail, canMentionAll]);

  const names = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of detail?.members ?? []) map.set(m.user.id, m.nickname ?? m.user.displayName);

    return map;
  }, [detail]);

  const roleList = useMemo(() => {
    const map = new Map<string, Role>();
    for (const r of detail?.roles ?? []) map.set(r.id, r);

    return map;
  }, [detail]);

  const filter = useCallback(
    (term: string) => {
      const target = term.toLowerCase().trim();
      const house = (m: Mentionable) =>
        !target || m.name.toLowerCase().includes(target) || (m.detail ?? "").toLowerCase().includes(target);

      return list.filter(house).slice(0, 10);
    },
    [list],
  );

  const mineRoles = useMemo(() => {
    const eu = detail?.members.find((m) => m.user.id === currentUserId);
    return new Set(eu?.roleIds ?? []);
  }, [detail, currentUserId]);

  const mentionsYou = useCallback(
    (m: {
      author: { id: string };
      mentions: string[];
      mentionRoleIds: string[];
      mentionEveryone: boolean;
    }) => {
      if (!currentUserId || m.author.id === currentUserId) return false;
      if (m.mentionEveryone) return true;
      if (m.mentions.includes(currentUserId)) return true;

      return m.mentionRoleIds.some((id) => mineRoles.has(id));
    },
    [currentUserId, mineRoles],
  );

  return { filter, names, roleList, mentionsYou };
}

export type ResolveMentions = Pick<ReturnType<typeof useMentions>, "names" | "roleList">;

export function detectMention(text: string, cursor: number) {
  const match = /(^|\s)@([^\s@]*)$/.exec(text.slice(0, cursor));
  if (!match) return null;

  const term = match[2] ?? "";
  return { term, start: cursor - term.length - 1 };
}
