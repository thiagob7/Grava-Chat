import { useCallback, useMemo } from "react";
import type { ProfilePublic } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";

export interface PersonCharms {
  profile: ProfilePublic | null;
  roleColor: string | null;
}

const WITHOUT_CHARM: PersonCharms = { profile: null, roleColor: null };

export function useCharms(guildId: string | undefined) {
  const { data: detail } = useFindGuild(guildId);

  const colors = useMemo(() => {
    const map = new Map<string, string>();
    if (!detail) return map;

    const withColor = detail.roles.filter((r) => r.color).sort((a, b) => b.position - a.position);
    if (withColor.length === 0) return map;

    for (const m of detail.members) {
      const role = withColor.find((r) => m.roleIds.includes(r.id));
      if (role?.color) map.set(m.user.id, role.color);
    }

    return map;
  }, [detail]);

  const badges = useCallback(
    (userId: string) => {
      const ids = detail?.profiles?.[userId]?.badges ?? [];
      if (!ids.length) return [];

      const byId = new Map((detail?.badges ?? []).map((e) => [e.id, e]));
      return ids.map((id) => byId.get(id)).filter((e) => e !== undefined);
    },
    [detail],
  );

  const resolve = useCallback(
    (userId: string): PersonCharms => {
      const profile = detail?.profiles?.[userId] ?? null;
      const roleColor = colors.get(userId) ?? null;

      if (!profile && !roleColor) return WITHOUT_CHARM;

      return { profile, roleColor };
    },
    [detail, colors],
  );

  return Object.assign(resolve, { badges });
}

export type ResolveCharms = ReturnType<typeof useCharms>;
