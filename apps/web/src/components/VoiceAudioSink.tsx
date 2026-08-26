import React from "react";

import { VoiceAudio } from "~/components/VoiceTrack";
import { useVoiceStore } from "~/stores/voice-store";

export const VoiceAudioSink: React.FC = () => {
  const tiles = useVoiceStore((s) => s.tiles);

  return (
    <div className="hidden" aria-hidden>
      {tiles.flatMap((tile) =>
        tile.audioTracks.map((track) => (
          <VoiceAudio key={track.sid ?? tile.identity} track={track} identity={tile.identity} />
        )),
      )}
    </div>
  );
};
