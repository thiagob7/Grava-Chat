import React, { useEffect, useRef, useState } from "react";

import { cn } from "~/lib/utils";

export const HoverGif: React.FC<{
  src: string;
  alt: string;
  playing: boolean;
  className?: string;
}> = ({ src, alt, playing, className }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const target = canvas.current;
      const paper = target?.getContext("2d");
      if (!target || !paper || !image.naturalWidth) return;

      target.width = image.naturalWidth;
      target.height = image.naturalHeight;
      paper.drawImage(image, 0, 0);
      setReady(true);
    };
    image.src = src;

    return () => {
      image.onload = null;
    };
  }, [src]);

  const still = ready && !playing;

  return (
    <>
      <canvas data-gc="gif-no-hover.canvas" ref={canvas} role="img" aria-label={alt} className={cn(className, !still && "hidden")} />
      {!still && <img data-gc="gif-no-hover.img" src={src} alt={alt} draggable={false} className={className} />}
    </>
  );
};
