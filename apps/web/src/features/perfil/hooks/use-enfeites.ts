import { useCallback, useMemo } from "react";
import type { PerfilPublico } from "@gravae/shared";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";

export interface EnfeitesDaPessoa {
  perfil: PerfilPublico | null;
  corDoCargo: string | null;
}

const SEM_ENFEITE: EnfeitesDaPessoa = { perfil: null, corDoCargo: null };

export function useEnfeites(guildId: string | undefined) {
  const { data: detail } = useFindGuild(guildId);

  const cores = useMemo(() => {
    const mapa = new Map<string, string>();
    if (!detail) return mapa;

    const comCor = detail.roles.filter((r) => r.color).sort((a, b) => b.position - a.position);
    if (comCor.length === 0) return mapa;

    for (const m of detail.members) {
      const cargo = comCor.find((r) => m.roleIds.includes(r.id));
      if (cargo?.color) mapa.set(m.user.id, cargo.color);
    }

    return mapa;
  }, [detail]);

  const emblemasDe = useCallback(
    (userId: string) => {
      const ids = detail?.profiles?.[userId]?.emblemas ?? [];
      if (!ids.length) return [];

      const porId = new Map((detail?.emblemas ?? []).map((e) => [e.id, e]));
      return ids.map((id) => porId.get(id)).filter((e) => e !== undefined);
    },
    [detail],
  );

  const resolver = useCallback(
    (userId: string): EnfeitesDaPessoa => {
      const perfil = detail?.profiles?.[userId] ?? null;
      const corDoCargo = cores.get(userId) ?? null;

      if (!perfil && !corDoCargo) return SEM_ENFEITE;

      return { perfil, corDoCargo };
    },
    [detail, cores],
  );

  return Object.assign(resolver, { emblemasDe });
}

export type ResolverEnfeites = ReturnType<typeof useEnfeites>;
