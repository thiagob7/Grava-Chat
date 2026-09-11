import { useMemo } from "react";
import type { Permission } from "@gravae/shared";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";

export interface Permissions {
  can: (permission: Permission) => boolean;
  canInChannel: (channelId: string | undefined, permission: Permission) => boolean;
}

export function usePermissions(detail: GuildDetailModel | undefined): Permissions {
  return useMemo(() => {
    const inServer = new Set<string>(detail?.permissions ?? []);
    const admin = inServer.has("ADMINISTRATOR");

    const can = (permission: Permission) => admin || inServer.has(permission);

    const canInChannel = (channelId: string | undefined, permission: Permission) => {
      if (!channelId) return can(permission);

      const fromChannel = detail?.channelPermissions?.[channelId];
      if (!fromChannel) return can(permission);

      return fromChannel.includes("ADMINISTRATOR") || fromChannel.includes(permission);
    };

    return { can, canInChannel };
  }, [detail]);
}
