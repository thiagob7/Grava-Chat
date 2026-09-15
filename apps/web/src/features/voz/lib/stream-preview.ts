import type { Room } from "livekit-client";

export const PREVIEW_REQUEST_TOPIC = "gravae.stream-preview.request";
export const PREVIEW_IMAGE_TOPIC = "gravae.stream-preview.image";

const PREVIEW_WIDTH = 480;
const PREVIEW_QUALITY = 0.7;
const SERVE_EVERY_MS = 3000;
const CACHE_MS = 10_000;
const WAIT_MS = 4000;

export function createThrottle(intervalMs: number, now: () => number = Date.now) {
  const last = new Map<string, number>();

  return (key: string) => {
    const at = now();
    const previous = last.get(key);
    if (previous !== undefined && at - previous < intervalMs) return false;

    last.set(key, at);
    return true;
  };
}

async function captureFrame(track: MediaStreamTrack): Promise<Blob | null> {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = new MediaStream([track]);

  try {
    await video.play();
    if (!video.videoWidth) {
      await new Promise<void>((resolve) => video.addEventListener("loadeddata", () => resolve(), { once: true }));
    }

    const scale = Math.min(1, PREVIEW_WIDTH / video.videoWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", PREVIEW_QUALITY));
  } catch {
    return null;
  } finally {
    video.pause();
    video.srcObject = null;
  }
}

export function servePreviews(room: Room, localScreen: () => MediaStreamTrack | null) {
  const allowed = createThrottle(SERVE_EVERY_MS);

  room.registerTextStreamHandler(PREVIEW_REQUEST_TOPIC, async (reader, { identity }) => {
    await reader.readAll().catch(() => "");

    const track = localScreen();
    if (!track || track.readyState !== "live" || !allowed(identity)) return;

    const frame = await captureFrame(track);
    if (!frame) return;

    await room.localParticipant
      .sendFile(new File([frame], "preview.jpg", { type: "image/jpeg" }), {
        topic: PREVIEW_IMAGE_TOPIC,
        destinationIdentities: [identity],
      })
      .catch(() => undefined);
  });
}

type Waiter = (url: string | null) => void;

export function createPreviewClient(room: Room) {
  const cache = new Map<string, { url: string; at: number }>();
  const waiting = new Map<string, Waiter[]>();

  const settle = (identity: string, url: string | null) => {
    const waiters = waiting.get(identity) ?? [];
    waiting.delete(identity);
    waiters.forEach((resolve) => resolve(url));
  };

  room.registerByteStreamHandler(PREVIEW_IMAGE_TOPIC, async (reader, { identity }) => {
    const chunks = await reader.readAll().catch(() => null);
    if (!chunks) return settle(identity, null);

    const previous = cache.get(identity);
    if (previous) URL.revokeObjectURL(previous.url);

    const url = URL.createObjectURL(new Blob(chunks as BlobPart[], { type: "image/jpeg" }));
    cache.set(identity, { url, at: Date.now() });
    settle(identity, url);
  });

  return {
    request(identity: string): Promise<string | null> {
      const cached = cache.get(identity);
      if (cached && Date.now() - cached.at < CACHE_MS) return Promise.resolve(cached.url);

      return new Promise((resolve) => {
        const list = waiting.get(identity);
        if (list) {
          list.push(resolve);
          return;
        }

        waiting.set(identity, [resolve]);
        window.setTimeout(() => settle(identity, cache.get(identity)?.url ?? null), WAIT_MS);

        void room.localParticipant
          .sendText("preview", { topic: PREVIEW_REQUEST_TOPIC, destinationIdentities: [identity] })
          .catch(() => settle(identity, null));
      });
    },

    dispose() {
      cache.forEach(({ url }) => URL.revokeObjectURL(url));
      cache.clear();
      waiting.forEach((waiters) => waiters.forEach((resolve) => resolve(null)));
      waiting.clear();
    },
  };
}

export type PreviewClient = ReturnType<typeof createPreviewClient>;
