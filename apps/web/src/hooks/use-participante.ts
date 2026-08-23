import { useCallback } from "react";

import { useFindGuild } from "~/@core/application/queries/guild/use-find-guild";
import { useEnfeites } from "~/hooks/use-enfeites";
import { useVoiceStore } from "~/stores/voice-store";

/**
 * Quem é o participante da chamada, pelo `identity` do LiveKit.
 *
 * O `identity` **já é o userId** — foi assim que o token foi emitido —, então dá
 * pra cruzar com o cache do servidor e pegar o nome, a foto e os enfeites
 * atuais.
 *
 * Isso conserta um bug que já existia: nome e foto vinham do `metadata` do
 * LiveKit, e o metadata é gravado no TOKEN, emitido uma vez no join. Quem
 * trocasse de avatar durante a chamada continuava aparecendo com o antigo até
 * sair e entrar de novo — e a mesma armadilha esperava o enfeite. Por isso o
 * enfeite nunca foi pelo metadata: ele congelaria igual.
 *
 * O `tile` continua sendo a queda: numa chamada com alguém que não está no
 * cache (ainda carregando), o nome do LiveKit é melhor do que nada.
 */
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
