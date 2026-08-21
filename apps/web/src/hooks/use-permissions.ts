import { useMemo } from "react";
import type { Permission } from "@gravae/shared";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";

export interface Permissoes {
  /** o que posso no servidor como um todo */
  can: (permissao: Permission) => boolean;
  /** e dentro de um canal, onde os overwrites podem mudar a resposta */
  canInChannel: (channelId: string | undefined, permissao: Permission) => boolean;
}

/**
 * As permissões vêm calculadas do servidor junto com o servidor (`detail`) —
 * o front nunca recalcula. Ele só decide o que MOSTRAR; quem decide o que pode
 * é a API, que checa de novo em toda rota. Aqui é só interface.
 */
export function usePermissions(detail: GuildDetailModel | undefined): Permissoes {
  return useMemo(() => {
    const noServidor = new Set<string>(detail?.permissions ?? []);
    const admin = noServidor.has("ADMINISTRATOR");

    const can = (permissao: Permission) => admin || noServidor.has(permissao);

    const canInChannel = (channelId: string | undefined, permissao: Permission) => {
      if (!channelId) return can(permissao);

      const doCanal = detail?.channelPermissions?.[channelId];
      // canal sem entrada = canal que ainda não carregou; cai no geral
      if (!doCanal) return can(permissao);

      return doCanal.includes("ADMINISTRATOR") || doCanal.includes(permissao);
    };

    return { can, canInChannel };
  }, [detail]);
}
