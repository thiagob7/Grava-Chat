import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { VoiceState } from "@gravae/shared";

import { queryKeys } from "~/@core/infra/constants/query-keys";
import type { GuildDetailModel } from "~/@core/domain/models/guild-model";
import { useVoiceStore } from "~/stores/voice-store";

/**
 * Reconcilia a lista da barra lateral com quem o LiveKit diz que está na sala.
 *
 * Existiam duas fontes de verdade sobre "quem está na chamada" e elas
 * divergiam na tela: a barra lateral vinha do NOSSO servidor (por socket) e o
 * palco vinha do LiveKit. Dava pra ver três pessoas nos quadros e duas na
 * lista — o que faz o app parecer quebrado mesmo com os dois lados "certos".
 *
 * Duas causas, as duas reais:
 *
 * 1. **Saída demora 6 segundos.** Quem fecha a aba não manda `voice:leave`; o
 *    servidor detecta a queda e espera `VOICE_GRACE_MS` antes de anunciar,
 *    porque um reload volta em ~2s e a pessoa espera continuar na chamada. A
 *    espera está certa — mas o LiveKit já sabe na hora.
 * 2. **Entrada pode se perder.** Um `voice:joined` que chega antes de o cache
 *    do servidor existir, ou uma reconexão de socket no meio, deixa alguém de
 *    fora da lista pra sempre: nada reconsulta depois.
 *
 * Para o canal em que VOCÊ está, o LiveKit é a autoridade — é literalmente a
 * sessão de mídia. Este gancho aplica isso no cache, então a barra lateral, o
 * palco e o contador passam a contar a mesma história, na hora.
 */
export function useVoiceSync(guildId: string | undefined) {
  const queryClient = useQueryClient();
  const channelId = useVoiceStore((s) => s.channelId);
  const tiles = useVoiceStore((s) => s.tiles);

  /**
   * Quem já apareceu no LiveKit nesta sala.
   *
   * Sem isto, remover "quem não está no LiveKit" apagaria justamente quem
   * acabou de entrar: o nosso servidor avisa ANTES de a pessoa terminar de
   * conectar na mídia, então haveria uma janela em que ela existe pro servidor
   * e ainda não pro SFU. Só removemos quem já esteve presente de fato.
   */
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

        const atuais = antigo.voiceStates[channelId] ?? [];

        // sai quem o LiveKit não tem mais — mas só quem já chegou a aparecer
        const mantidos = atuais.filter(
          (v) => presentes.has(v.userId) || !vistos.current.has(v.userId),
        );

        // entra quem está na mídia e o servidor não contou
        const faltando = tiles.filter((t) => !atuais.some((v) => v.userId === t.identity));

        if (mantidos.length === atuais.length && !faltando.length) return antigo;

        /**
         * O estado sintetizado é provisório e serve só pra pessoa aparecer AGORA.
         * O que o LiveKit sabe (mudo, câmera, tela) já basta pra desenhar a
         * linha; o resto chega no `voice:joined` ou na próxima consulta.
         */
        const sintetizados: VoiceState[] = faltando.map((t) => ({
          userId: t.identity,
          channelId,
          guildId,
          socketId: "",
          orphanedAt: null,
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
            ...antigo.voiceStates,
            [channelId]: [...mantidos, ...sintetizados],
          },
        };
      },
    );
  }, [guildId, channelId, tiles, queryClient]);
}
