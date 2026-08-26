import { useEffect, useRef, useState } from "react";

import { criarMedidorDeTeste } from "~/lib/audio-gate";
import { useVoicePrefs } from "~/stores/voice-prefs";
import { useVoiceStore } from "~/stores/voice-store";

interface Medicao {
  nivel: number;
  aberto: boolean;
  erro: string | null;
  stream: MediaStream | null;
}

export function useVoiceMeter(ativo: boolean): Medicao {
  const emChamada = useVoiceStore((s) => s.channelId !== null);
  const observarNivel = useVoiceStore((s) => s.observarNivel);
  const prefs = useVoicePrefs();

  const [medicao, setMedicao] = useState<Medicao>({
    nivel: 0,
    aberto: false,
    erro: null,
    stream: null,
  });

  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    if (!ativo) {
      setMedicao({ nivel: 0, aberto: false, erro: null, stream: null });
      return;
    }

    if (emChamada) {
      return observarNivel((nivel, aberto) =>
        setMedicao((atual) => ({ ...atual, nivel, aberto, erro: null })),
      );
    }

    let vivo = true;
    let parar: (() => void) | null = null;
    let relogio: ReturnType<typeof setInterval> | null = null;

    void criarMedidorDeTeste(prefsRef.current.entradaId ?? undefined)
      .then((medidor) => {
        if (!vivo) return medidor.parar();

        parar = medidor.parar;
        setMedicao((atual) => ({ ...atual, stream: medidor.stream, erro: null }));

        relogio = setInterval(() => {
          const nivel = medidor.ler();
          const { modo, sensibilidadeAutomatica, limiar } = prefsRef.current;

          const aberto =
            modo === "ptt" ? false : nivel >= (sensibilidadeAutomatica ? 0.05 : limiar);

          setMedicao((atual) => ({ ...atual, nivel, aberto }));
        }, 60);
      })
      .catch(() =>
        setMedicao({
          nivel: 0,
          aberto: false,
          stream: null,
          erro: "Não deu pra abrir o microfone. Confira a permissão no navegador.",
        }),
      );

    return () => {
      vivo = false;
      if (relogio) clearInterval(relogio);
      parar?.();
    };
  }, [ativo, emChamada, observarNivel]);

  return medicao;
}
