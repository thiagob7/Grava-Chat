import React from "react";

import { VoiceAudio } from "~/features/voz/components/VoiceTrack";
import { useVoiceStore } from "~/features/voz/stores/voice-store";

export const VoiceAudioSink: React.FC = () => {
  const tiles = useVoiceStore((s) => s.tiles);
  const assistindo = useVoiceStore((s) => s.assistindo);

  return (
    <div data-gc="voz.voice-audio-sink.div" className="hidden" aria-hidden>
      {tiles.map((tile) => (
        <React.Fragment key={tile.identity}>
          {tile.micTrack && <VoiceAudio data-gc="voz.voice-audio-sink.voice-audio" track={tile.micTrack} identity={tile.identity} />}

          {tile.screenAudioTrack && assistindo === tile.identity && (
            <VoiceAudio data-gc="voz.voice-audio-sink.voice-audio--2" track={tile.screenAudioTrack} identity={tile.identity} fonte="tela" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
