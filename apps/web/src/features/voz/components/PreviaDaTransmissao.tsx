import React, { useEffect, useState } from "react";

import { useVoiceStore } from "~/features/voz/stores/voice-store";

const REFRESH_MS = 10_000;

export const BroadcastPreview: React.FC<{ identity: string }> = ({ identity }) => {
  const previews = useVoiceStore((s) => s.previews);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previews) return;

    let live = true;
    let timer = 0;

    const load = async () => {
      const next = await previews.request(identity);
      if (!live) return;

      if (next) setUrl(next);
      timer = window.setTimeout(load, REFRESH_MS);
    };

    void load();

    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [previews, identity]);

  if (!url) return null;

  return <img data-gc="voz.previa-da-transmissao.img" src={url} alt="" className="absolute inset-0 size-full object-contain" />;
};
