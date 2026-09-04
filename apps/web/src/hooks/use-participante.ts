import { useCallback } from "react";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useEnfeites } from "~/hooks/use-enfeites";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

export function useParticipante() {
  const guildId = useVoiceStore((v) => v.guildId);
  const { data: detail } = useFindGuild(guildId ?? undefined);
  const enfeitesDe = useEnfeites(guildId ?? undefined);

  return useCallback(
    (identity: string, queda: { name: string; avatarUrl: string | null }) => {
      const membro = detail?.members.find((m) => m.user.id === identity);
      const { perfil, corDoCargo } = enfeitesDe(identity);

      return {
        nome: membro?.nickname ?? membro?.user.displayName ?? queda.name,
        avatarUrl: membro?.user.avatarUrl ?? queda.avatarUrl,
        perfil,
        corDoCargo,
      };
    },
    [detail, enfeitesDe],
  );
}
