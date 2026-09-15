const PROBE_BYTES = 256 * 1024;

export function isAnimatedWebp(bytes: Uint8Array): boolean {
  const header = new TextDecoder("latin1").decode(bytes.subarray(0, 16));
  if (!header.startsWith("RIFF") || header.slice(8, 12) !== "WEBP") return false;

  return new TextDecoder("latin1").decode(bytes).includes("ANIM");
}

export async function isAnimatedImage(url: string): Promise<boolean> {
  if (/\.gif($|\?)/i.test(url)) return true;

  const reply = await fetch(url, {
    headers: { range: `bytes=0-${PROBE_BYTES - 1}` },
    signal: AbortSignal.timeout(5000),
  }).catch(() => null);
  if (!reply?.ok) return false;

  const type = reply.headers.get("content-type")?.toLowerCase() ?? "";
  if (type.startsWith("image/gif")) {
    void reply.body?.cancel();
    return true;
  }

  if (!type.startsWith("image/webp")) {
    void reply.body?.cancel();
    return false;
  }

  return isAnimatedWebp(new Uint8Array(await reply.arrayBuffer()));
}
