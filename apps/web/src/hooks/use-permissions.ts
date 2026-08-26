import { useMemo } from "react";
import type { Permission } from "@gravae/shared";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";

export interface Permissoes {
  can: (permissao: Permission) => boolean;
  canInChannel: (channelId: string | undefined, permissao: Permission) => boolean;
}

export function usePermissions(detail: GuildDetailModel | undefined): Permissoes {
  return useMemo(() => {
    const noServidor = new Set<string>(detail?.permissions ?? []);
    const admin = noServidor.has("ADMINISTRATOR");

    const can = (permissao: Permission) => admin || noServidor.has(permissao);

    const canInChannel = (channelId: string | undefined, permissao: Permission) => {
      if (!channelId) return can(permissao);

      const doCanal = detail?.channelPermissions?.[channelId];
      if (!doCanal) return can(permissao);

      return doCanal.includes("ADMINISTRATOR") || doCanal.includes(permissao);
    };

    return { can, canInChannel };
  }, [detail]);
}
