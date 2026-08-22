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
export function useVoiceSync(guildId: string | undefined, currentUserId?: string) {
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

        /**
         * Você só pode estar em UMA chamada. Se aparece em outro canal, aquilo
         * é sobra de cache — um `voice:left` que se perdeu, ou o estado antigo
         * de antes de trocar de canal. Ninguém mais reconsulta isso, então o
         * fantasma ficava lá pra sempre, inclusive com o cronômetro contando.
         */
        const semFantasmas = currentUserId
          ? Object.fromEntries(
              Object.entries(antigo.voiceStates).map(([id, estados]) => [
                id,
                id === channelId ? estados : estados.filter((v) => v.userId !== currentUserId),
              ]),
            )
          : antigo.voiceStates;

        const atuais = semFantasmas[channelId] ?? [];

        // sai quem o LiveKit não tem mais — mas só quem já chegou a aparecer
        const mantidos = atuais
          .filter((v) => presentes.has(v.userId) || !vistos.current.has(v.userId))
          /**
           * Câmera e tela também vêm do LiveKit para quem está presente. O
           * `voice:updated` pode se perder, e aí o ícone de "transmitindo"
           * fica aceso na barra lateral com a live já encerrada.
           */
          .map((v) => {
            const tile = tiles.find((t) => t.identity === v.userId);
            if (!tile) return v;

            return {
              ...v,
              camera: Boolean(tile.cameraTrack),
              screenShare: Boolean(tile.screenTrack),
            };
          });

        // entra quem está na mídia e o servidor não contou
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
          // não sabemos quando entrou: agora é o palpite menos errado, e o
          // valor real chega no `voice:joined` logo em seguida
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
