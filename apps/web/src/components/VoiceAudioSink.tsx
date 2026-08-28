import React from "react";

import { VoiceAudio } from "~/components/VoiceTrack";
import { useVoiceStore } from "~/stores/voice-store";

/**
 * Onde o áudio da chamada realmente toca — fora da árvore visível, pra que
 * trocar de tela não interrompa o som.
 *
 * A voz de cada pessoa toca sempre. O som da transmissão, não: ele só entra
 * pra quem está assistindo àquela transmissão. Antes os dois vinham no mesmo
 * campo e tocavam juntos, e o resultado era o som da live de alguém invadindo
 * quem tinha voltado pra grade e não queria mais ver nada.
 */
export const VoiceAudioSink: React.FC = () => {
  const tiles = useVoiceStore((s) => s.tiles);
  const assistindo = useVoiceStore((s) => s.assistindo);

  return (
    <div className="hidden" aria-hidden>
      {tiles.map((tile) => (
        <React.Fragment key={tile.identity}>
          {tile.micTrack && <VoiceAudio track={tile.micTrack} identity={tile.identity} />}

          {tile.screenAudioTrack && assistindo === tile.identity && (
            <VoiceAudio track={tile.screenAudioTrack} identity={tile.identity} fonte="tela" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
