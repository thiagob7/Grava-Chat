import { useEffect, useState } from "react";

export const DEFAULT_RATIO = 16 / 9;
export const RATIO_MORE_NARROW = 32 / 9;

export const pressRatio = (width: number, height: number) => {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_RATIO;
  }

  return Math.min(Math.max(width / height, DEFAULT_RATIO), RATIO_MORE_NARROW);
};

export const useTrackRatio = (url: string | null | undefined) => {
  const [ratio, setRatio] = useState(DEFAULT_RATIO);

  useEffect(() => {
    setRatio(DEFAULT_RATIO);
    if (!url) return;

    let live = true;
    const image = new Image();

    image.onload = () => {
      if (live) setRatio(pressRatio(image.naturalWidth, image.naturalHeight));
    };

    image.src = url;

    return () => {
      live = false;
    };
  }, [url]);

  return ratio;
};
