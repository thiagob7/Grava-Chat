import { useCallback, useEffect, useRef, useState } from "react";

import {
  encaixarOndas,
  escreverOndas,
  extensaoDoFormato,
  formatoDeGravacao,
  LIMITE_MS,
  TAXA_DE_VOZ,
} from "~/features/conversa/lib/gravador-de-voz";

export interface RecadoGravado {
  file: File;
  duracaoMs: number;
  ondas: string;
}

/// De quanto em quanto tempo se olha o microfone para desenhar a onda. 50ms
/// dá 40 medidas em 2 segundos — sobra desenho e não pesa nada.
const PASSO_MS = 50;

/*
  Gravar um recado de voz.

  A onda é medida ENQUANTO se grava, com o analisador do próprio navegador:
  é o único momento em que o som passa por aqui de graça. Depois só sobraria
  decodificar o arquivo inteiro para desenhar barrinha, o que é caro e não
  acrescenta nada.

  Tudo o que é aberto — microfone, contexto de áudio, relógio — fecha em um
  lugar só. Microfone esquecido aberto acende a luz da câmera do computador e
  assusta, com razão.
*/
export function useGravadorDeVoz() {
  const [gravando, setGravando] = useState(false);
  const [ms, setMs] = useState(0);
  const [picos, setPicos] = useState<number[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  const gravador = useRef<MediaRecorder | null>(null);
  const trilha = useRef<MediaStream | null>(null);
  const contexto = useRef<AudioContext | null>(null);
  const relogio = useRef<ReturnType<typeof setInterval> | null>(null);
  const pedacos = useRef<Blob[]>([]);
  const medidos = useRef<number[]>([]);
  const comecou = useRef(0);

  const desligar = useCallback(() => {
    if (relogio.current) clearInterval(relogio.current);
    relogio.current = null;

    trilha.current?.getTracks().forEach((t) => t.stop());
    trilha.current = null;

    void contexto.current?.close().catch(() => undefined);
    contexto.current = null;
  }, []);

  useEffect(() => desligar, [desligar]);

  const comecar = useCallback(async () => {
    setErro(null);

    const formato = formatoDeGravacao((tipo) => MediaRecorder.isTypeSupported(tipo));
    if (!formato) {
      setErro("Este navegador não grava áudio.");
      return false;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
    } catch {
      setErro("Sem acesso ao microfone.");
      return false;
    }

    trilha.current = stream;
    pedacos.current = [];
    medidos.current = [];
    comecou.current = Date.now();

    const ctx = new AudioContext();
    contexto.current = ctx;

    const analisador = ctx.createAnalyser();
    analisador.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analisador);

    const amostra = new Uint8Array(analisador.frequencyBinCount);

    const rec = new MediaRecorder(stream, { mimeType: formato, audioBitsPerSecond: TAXA_DE_VOZ });
    rec.ondataavailable = (e) => e.data.size && pedacos.current.push(e.data);
    rec.start(250);
    gravador.current = rec;

    relogio.current = setInterval(() => {
      analisador.getByteTimeDomainData(amostra);

      /// O analisador entrega a onda centrada em 128; o pico é a maior
      /// distância desse meio, normalizada.
      let maior = 0;
      for (const v of amostra) maior = Math.max(maior, Math.abs(v - 128) / 128);

      medidos.current.push(maior);
      setPicos([...medidos.current]);

      const passado = Date.now() - comecou.current;
      setMs(passado);

      if (passado >= LIMITE_MS) rec.stop();
    }, PASSO_MS);

    setGravando(true);
    return true;
  }, []);

  /*
    Fecha a gravação e devolve o arquivo. `guardar: false` é o descartar:
    para tudo do mesmo jeito, mas não entrega nada — o áudio some sem nunca
    ter saído do aparelho.
  */
  const parar = useCallback(
    (guardar = true): Promise<RecadoGravado | null> => {
      const rec = gravador.current;
      if (!rec) return Promise.resolve(null);

      return new Promise((resolve) => {
        rec.onstop = () => {
          const duracaoMs = Math.min(Date.now() - comecou.current, LIMITE_MS);
          const tipo = rec.mimeType || "audio/webm";
          const blob = new Blob(pedacos.current, { type: tipo });

          desligar();
          gravador.current = null;
          setGravando(false);
          setMs(0);
          setPicos([]);

          if (!guardar || !blob.size) return resolve(null);

          resolve({
            file: new File([blob], `recado.${extensaoDoFormato(tipo)}`, { type: tipo }),
            duracaoMs,
            ondas: escreverOndas(encaixarOndas(medidos.current)),
          });
        };

        rec.state === "inactive" ? rec.onstop?.(new Event("stop")) : rec.stop();
      });
    },
    [desligar],
  );

  return { gravando, ms, picos, erro, comecar, parar };
}
