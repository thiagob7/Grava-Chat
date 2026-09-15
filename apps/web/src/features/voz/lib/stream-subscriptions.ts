import { Track } from "livekit-client";

const STREAM_SOURCES = new Set<Track.Source>([Track.Source.ScreenShare, Track.Source.ScreenShareAudio]);

export const isStreamSource = (source: Track.Source) => STREAM_SOURCES.has(source);

export function wantsSubscription(source: Track.Source, identity: string, watching: string | null): boolean {
  if (isStreamSource(source)) return identity === watching;
  return true;
}
