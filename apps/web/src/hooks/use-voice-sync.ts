import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { VoiceState } from "@gravae/shared";

import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { useVoiceStore } from "~/stores/voice-store";

export function useVoiceSync(guildId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();
  const channelId = useVoiceStore((s) => s.channelId);
  const tiles = useVoiceStore((s) => s.tiles);

  const vistos = useRef(new Set<string>());

  useEffect(() => {
    vistos.current = new Set();
  }, [channelId]);

  useEffect(() => {
    if (!guildId || !channelId) return;

    const presentes = new Set(tiles.map((t) => t.identity));
    for (const id of presentes) vistos.current.add(id);

    queryClient.setQueryData(
      queryKeys.guild.find(guildId),
      (antigo: GuildDetailModel | undefined) => {
        if (!antigo) return antigo;

        const semFantasmas = currentUserId
          ? Object.fromEntries(
              Object.entries(antigo.voiceStates).map(([id, estados]) => [
                id,
                id === channelId ? estados : estados.filter((v) => v.userId !== currentUserId),
              ]),
            )
          : antigo.voiceStates;

        const atuais = semFantasmas[channelId] ?? [];

        const mantidos = atuais
          .filter((v) => presentes.has(v.userId) || !vistos.current.has(v.userId))
          .map((v) => {
            const tile = tiles.find((t) => t.identity === v.userId);
            if (!tile) return v;

            return {
              ...v,
              camera: Boolean(tile.cameraTrack),
              screenShare: Boolean(tile.screenTrack),
            };
          });

        const faltando = tiles.filter((t) => !atuais.some((v) => v.userId === t.identity));

        const limpou = Object.entries(semFantasmas).some(
          ([id, estados]) => estados.length !== (antigo.voiceStates[id] ?? []).length,
        );

        const flagsIguais = mantidos.every((v, i) => {
          const antes = atuais[i];
          return antes && antes.camera === v.camera && antes.screenShare === v.screenShare;
        });

        if (mantidos.length === atuais.length && !faltando.length && !limpou && flagsIguais) {
          return antigo;
        }

        const sintetizados: VoiceState[] = faltando.map((t) => ({
          userId: t.identity,
          channelId,
          guildId,
          socketId: "",
          /// Sintetizado a partir do que o SFU mostra: não veio de um pedido
          /// de aba nenhuma, então não tem identidade.
          clienteId: null,
          orphanedAt: null,
          joinedAt: Date.now(),
          selfMute: !t.micEnabled,
          selfDeaf: false,
          serverMute: false,
          serverDeaf: false,
          camera: Boolean(t.cameraTrack),
          screenShare: Boolean(t.screenTrack),
        }));

        return {
          ...antigo,
          voiceStates: {
            ...semFantasmas,
            [channelId]: [...mantidos, ...sintetizados],
          },
        };
      },
    );
  }, [guildId, channelId, tiles, currentUserId, queryClient]);
}
