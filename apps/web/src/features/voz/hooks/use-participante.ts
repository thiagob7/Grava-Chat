import { useCallback } from "react";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useCharms } from "~/features/perfil/hooks/use-enfeites";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

export function useParticipant() {
  const guildId = useVoiceStore((v) => v.guildId);
  const { data: detail } = useFindGuild(guildId ?? undefined);
  const charms = useCharms(guildId ?? undefined);

  return useCallback(
    (identity: string, fall: { name: string; avatarUrl: string | null }) => {
      const member = detail?.members.find((m) => m.user.id === identity);
      const { profile, roleColor } = charms(identity);

      return {
        name: member?.nickname ?? member?.user.displayName ?? fall.name,
        avatarUrl: member?.user.avatarUrl ?? fall.avatarUrl,
        profile,
        roleColor,
      };
    },
    [detail, charms],
  );
}
