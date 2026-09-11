import React from "react";

import { urlDoEmoji } from "~/features/expressao/lib/twemoji";
import { cn } from "~/lib/utils";

interface EmojiProps {
  emoji: string;
  className?: string;
}

export const Emoji: React.FC<EmojiProps> = ({ emoji, className }) => {
  const [withoutDrawing, setWithoutDrawing] = React.useState(false);

  React.useEffect(() => setWithoutDrawing(false), [emoji]);

  if (withoutDrawing) {
    return (
      <span data-gc="expressao.emoji.span" className={cn("inline-block text-center leading-none", className)}>{emoji}</span>
    );
  }

  return (
    <img data-gc="expressao.emoji.img"
      src={urlDoEmoji(emoji)}
      alt={emoji}
      draggable={false}
      loading="lazy"
      onError={() => setWithoutDrawing(true)}
      className={cn("inline-block size-[1.375em] align-text-bottom", className)}
    />
  );
};
