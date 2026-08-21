import React from "react";

import { VoiceAudio } from "~/components/VoiceTrack";
import { useVoiceStore } from "~/stores/voice-store";

/**
 * Onde o áudio da chamada realmente toca.
 *
 * Fica FORA das rotas, montado enquanto a aplicação estiver aberta. Antes esses
 * elementos viviam dentro da tela do canal de voz — ao navegar pro #geral a
 * tela desmontava, os <audio> saíam do DOM e o som simplesmente parava, mesmo
 * com a chamada conectada. No Discord você continua ouvindo enquanto anda pelos
 * canais; é isso que este componente garante.
 */
export const VoiceAudioSink: React.FC = () => {
  const tiles = useVoiceStore((s) => s.tiles);

  return (
    <div className="hidden" aria-hidden>
      {tiles.flatMap((tile) =>
        tile.audioTracks.map((track) => <VoiceAudio key={track.sid ?? tile.identity} track={track} />),
      )}
    </div>
  );
};
