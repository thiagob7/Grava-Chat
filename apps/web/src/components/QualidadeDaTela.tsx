import React, { useEffect, useState } from "react";
import type { Track } from "livekit-client";

/*
  A resolução e a taxa de quadros do que está sendo transmitido.

  Serve pra uma pergunta que aparece toda vez que alguém compartilha código ou
  planilha: "tá ruim pra ler ou é a minha tela?". Com o número na faixa, quem
  assiste sabe se o borrão é limite da transmissão ou do próprio monitor — e
  quem transmite descobre que está mandando 720p sem querer.

  Vem do `getSettings()` da trilha, e não do `dimensions` do LiveKit: aquele só
  existe na ponta de quem publica, e o número interessa justamente pra quem
  está do outro lado.
*/
export const QualidadeDaTela: React.FC<{ track: Track }> = ({ track }) => {
  const [medida, setMedida] = useState<{ altura: number; fps: number | null } | null>(null);

  useEffect(() => {
    /*
      Mede de tempos em tempos, e não uma vez: no primeiro instante depois de
      entrar, a trilha ainda não recebeu quadro nenhum e devolve zero. E a
      resolução muda no meio do caminho — quando a rede aperta, o SFU derruba
      a camada e o número tem que acompanhar.
    */
    const medir = () => {
      const ajustes = track.mediaStreamTrack?.getSettings?.();
      const altura = ajustes?.height ?? 0;

      setMedida(altura > 0 ? { altura, fps: ajustes?.frameRate ? Math.round(ajustes.frameRate) : null } : null);
    };

    medir();
    const relogio = setInterval(medir, 3000);
    return () => clearInterval(relogio);
  }, [track]);

  if (!medida) return null;

  return (
    <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/90">
      {medida.altura}p{medida.fps ? ` · ${medida.fps} fps` : ""}
    </span>
  );
};
