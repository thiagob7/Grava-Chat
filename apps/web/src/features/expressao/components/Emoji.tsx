import React from "react";

import { urlDoEmoji } from "~/features/expressao/lib/twemoji";
import { cn } from "~/lib/utils";

interface EmojiProps {
  emoji: string;
  className?: string;
}

export const Emoji: React.FC<EmojiProps> = ({ emoji, className }) => {
  const [semDesenho, setSemDesenho] = React.useState(false);

  React.useEffect(() => setSemDesenho(false), [emoji]);

  if (semDesenho) {
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
      onError={() => setSemDesenho(true)}
      className={cn("inline-block size-[1.375em] align-text-bottom", className)}
    />
  );
};
