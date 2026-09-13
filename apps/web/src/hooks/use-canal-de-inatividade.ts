import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { queryKeys } from "~/@core/infra/constants/query-keys";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

const SIGNALS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;

const CHECK_MS = 15_000;

export function useAfkChannel() {
  const queryClient = useQueryClient();

  useEffect(() => {
    let lastActivity = Date.now();
    const touch = () => {
      lastActivity = Date.now();
    };

    const unsubscribe = useVoiceStore.subscribe((state) => {
      if (state.tiles.some((tile) => tile.isLocal && tile.speaking)) touch();
    });

    const check = () => {
      const voice = useVoiceStore.getState();
      if (!voice.channelId || !voice.guildId || voice.connecting) return;

      const detail = queryClient.getQueryData<GuildDetailModel>(queryKeys.guild.detail(voice.guildId));
      const afkChannelId = detail?.guild.afkChannelId;
      if (!afkChannelId || afkChannelId === voice.channelId) return;
      if (!detail.channels.some((channel) => channel.id === afkChannelId)) return;

      const timeout = (detail.guild.afkTimeoutSeconds ?? 300) * 1000;
      if (Date.now() - lastActivity < timeout) return;

      touch();
      void voice.join(afkChannelId).catch(() => undefined);
      toast.info("Você ficou inativo e foi levado para o canal de inatividade.");
    };

    for (const event of SIGNALS) window.addEventListener(event, touch, { passive: true });
    const timer = setInterval(check, CHECK_MS);

    return () => {
      clearInterval(timer);
      unsubscribe();
      for (const event of SIGNALS) window.removeEventListener(event, touch);
    };
  }, [queryClient]);
}
