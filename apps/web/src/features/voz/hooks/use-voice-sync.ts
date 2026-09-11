import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { VoiceState } from "@gravae/shared";

import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

export function useVoiceSync(guildId: string | undefined, currentUserId?: string) {
  const queryClient = useQueryClient();
  const channelId = useVoiceStore((s) => s.channelId);
  const tiles = useVoiceStore((s) => s.tiles);

  const seen = useRef(new Set<string>());

  useEffect(() => {
    seen.current = new Set();
  }, [channelId]);

  useEffect(() => {
    if (!guildId || !channelId) return;

    const present = new Set(tiles.map((t) => t.identity));
    for (const id of present) seen.current.add(id);

    queryClient.setQueryData(
      queryKeys.guild.find(guildId),
      (old: GuildDetailModel | undefined) => {
        if (!old) return old;

        const withoutGhosts = currentUserId
          ? Object.fromEntries(
              Object.entries(old.voiceStates).map(([id, states]) => [
                id,
                id === channelId ? states : states.filter((v) => v.userId !== currentUserId),
              ]),
            )
          : old.voiceStates;

        const current = withoutGhosts[channelId] ?? [];

        const kept = current
          .filter((v) => present.has(v.userId) || !seen.current.has(v.userId))
          .map((v) => {
            const tile = tiles.find((t) => t.identity === v.userId);
            if (!tile) return v;

            return {
              ...v,
              camera: Boolean(tile.cameraTrack),
              screenShare: Boolean(tile.screenTrack),
            };
          });

        const missing = tiles.filter((t) => !current.some((v) => v.userId === t.identity));

        const cleared = Object.entries(withoutGhosts).some(
          ([id, states]) => states.length !== (old.voiceStates[id] ?? []).length,
        );

        const flagsEqual = kept.every((v, i) => {
          const before = current[i];
          return before && before.camera === v.camera && before.screenShare === v.screenShare;
        });

        if (kept.length === current.length && !missing.length && !cleared && flagsEqual) {
          return old;
        }

        const synthesized: VoiceState[] = missing.map((t) => ({
          userId: t.identity,
          channelId,
          guildId,
          socketId: "",
          clientId: null,
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
          ...old,
          voiceStates: {
            ...withoutGhosts,
            [channelId]: [...kept, ...synthesized],
          },
        };
      },
    );
  }, [guildId, channelId, tiles, currentUserId, queryClient]);
}
