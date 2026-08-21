import { useEffect, useRef, useState } from "react";
import { ConnectionQuality, Track, type LocalTrack } from "livekit-client";

import { useVoiceStore } from "~/stores/voice-store";

/**
 * O ping da chamada, em milissegundos, e o histórico recente.
 *
 * Vem do `currentRoundTripTime` do par de candidatos ICE que venceu — é a ida e
 * volta real até o SFU, a mesma medida que o Discord mostra. O
 * `connectionQuality` do LiveKit sozinho não serve: ele diz "boa" ou "ruim", e
 * quem está reclamando de atraso quer o número.
 *
 * Só existe enquanto há track publicada. Quem entrou na chamada com o microfone
 * negado não tem de onde tirar o número, e aí a qualidade vira a resposta.
 */

/** 3s é o compromisso: número vivo o suficiente, sem varrer estatística à toa. */
const INTERVALO_MS = 3000;

/** ~4 minutos de histórico, que é o que cabe no gráfico sem virar borrão. */
const AMOSTRAS = 80;

export interface PingDaChamada {
  ms: number | null;
  /** média das amostras do histórico — o número que diz se está ruim SEMPRE */
  media: number | null;
  /** 0..100, de pacotes de saída perdidos */
  perda: number | null;
  qualidade: ConnectionQuality;
  /** do mais antigo pro mais novo; `null` = medição sem resposta */
  historico: (number | null)[];
}

const VAZIO: PingDaChamada = {
  ms: null,
  media: null,
  perda: null,
  qualidade: ConnectionQuality.Unknown,
  historico: [],
};

export function useVoicePing(): PingDaChamada {
  const room = useVoiceStore((s) => s.room);
  const [ping, setPing] = useState<PingDaChamada>(VAZIO);

  /**
   * A perda de pacotes vem em contadores ACUMULADOS desde o início da chamada.
   * Usar o valor cru daria uma taxa que só cai com o tempo e nunca reage a um
   * problema agora — por isso guardamos a leitura anterior e olhamos a
   * diferença entre duas medições.
   */
  const anterior = useRef<{ perdidos: number; enviados: number } | null>(null);

  useEffect(() => {
    if (!room) {
      setPing(VAZIO);
      anterior.current = null;
      return;
    }

    let vivo = true;

    const medir = async () => {
      const publicacao = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const track = publicacao?.track as LocalTrack | undefined;
      const qualidade = room.localParticipant.connectionQuality;

      let rtt: number | null = null;
      let perda: number | null = null;

      try {
        const relatorio = await track?.getRTCStatsReport();

        relatorio?.forEach((entrada) => {
          // só o par que está de fato transportando a mídia; os outros são
          // candidatos descartados, com valores que não querem dizer nada
          if (entrada.type === "candidate-pair" && entrada.state === "succeeded") {
            const valor = (entrada as { currentRoundTripTime?: number }).currentRoundTripTime;
            if (typeof valor === "number") rtt = Math.round(valor * 1000);
          }

          if (entrada.type === "outbound-rtp") {
            const e = entrada as { packetsSent?: number };
            const enviados = e.packetsSent ?? 0;
            const perdidos =
              (entrada as unknown as { retransmittedPacketsSent?: number }).retransmittedPacketsSent ?? 0;

            const antes = anterior.current;
            if (antes && enviados > antes.enviados) {
              const dEnviados = enviados - antes.enviados;
              const dPerdidos = Math.max(0, perdidos - antes.perdidos);
              perda = Math.min(100, (dPerdidos / dEnviados) * 100);
            }

            anterior.current = { perdidos, enviados };
          }
        });
      } catch {
        // conexão caindo no meio da medição não é motivo pra barulho na tela
      }

      if (!vivo) return;

      setPing((atual) => {
        const historico = [...atual.historico, rtt].slice(-AMOSTRAS);
        const validos = historico.filter((v): v is number => v !== null);

        return {
          ms: rtt,
          media: validos.length
            ? Math.round(validos.reduce((a, b) => a + b, 0) / validos.length)
            : null,
          perda: perda ?? atual.perda,
          qualidade,
          historico,
        };
      });
    };

    void medir();
    const relogio = setInterval(() => void medir(), INTERVALO_MS);

    return () => {
      vivo = false;
      clearInterval(relogio);
    };
  }, [room]);

  return ping;
}

/**
 * Verde até 100 ms, amarelo até 200, vermelho acima — e pela qualidade quando
 * não há número. Os cortes seguem o que se sente numa conversa: até 100 ms
 * ninguém percebe, a partir de 200 as pessoas começam a se atropelar.
 */
export function corDoPing({ ms, qualidade }: Pick<PingDaChamada, "ms" | "qualidade">): string {
  if (ms !== null) {
    if (ms <= 100) return "text-online";
    if (ms <= 200) return "text-idle";
    return "text-danger";
  }

  if (qualidade === ConnectionQuality.Excellent || qualidade === ConnectionQuality.Good) {
    return "text-online";
  }
  if (qualidade === ConnectionQuality.Poor) return "text-idle";
  if (qualidade === ConnectionQuality.Lost) return "text-danger";

  return "text-ink-faint";
}
