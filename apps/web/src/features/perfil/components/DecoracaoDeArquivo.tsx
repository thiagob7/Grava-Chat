import React, { useCallback, useRef } from "react";
import type { Decoration } from "@gravae/shared";

import {
  loadDecoration,
  decorationSlack,
  decorationImage,
  decorationSegment,
} from "~/features/perfil/lib/decoracoes";
import { useLottie } from "~/features/perfil/lib/lottie";

interface FilePropsDecoration {
  decoration: Decoration;
  animate: boolean;
  crop?: React.CSSProperties;
}

export const FileDecoration: React.FC<FilePropsDecoration> = ({
  decoration,
  animate,
  crop,
}) => {
  const inset = decorationSlack(decoration);
  const url = decorationImage(decoration);

  if (url)
    return <AsImage data-gc="perfil.decoracao-de-arquivo.as-image" key={`imagem:${decoration}`} url={url} inset={inset} crop={crop} />;

  return (
    <AsLottie data-gc="perfil.decoracao-de-arquivo.as-lottie"
      key={`lottie:${decoration}`}
      decoration={decoration}
      animate={animate}
      inset={inset}
      crop={crop}
    />
  );
};

const AsImage: React.FC<{ url: string; inset: string; crop?: React.CSSProperties }> = ({
  url,
  inset,
  crop,
}) => (
  <span data-gc="perfil.decoracao-de-arquivo.span" aria-hidden className="gc-camada" style={{ inset, ...crop }}>
    <img data-gc="perfil.decoracao-de-arquivo.img"
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-full object-contain"
    />
  </span>
);

const AsLottie: React.FC<{
  decoration: Decoration;
  animate: boolean;
  inset: string;
  crop?: React.CSSProperties;
}> = ({ decoration, animate, inset, crop }) => {
  const box = useRef<HTMLSpanElement>(null);

  useLottie(box, {
    key: decoration,
    load: useCallback(() => loadDecoration(decoration), [decoration]),
    animate,
    repeat: true,
    segment: decorationSegment(decoration),
  });

  return <span data-gc="perfil.decoracao-de-arquivo.span--2" ref={box} aria-hidden className="gc-camada" style={{ inset, ...crop }} />;
};
