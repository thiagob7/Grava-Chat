import React from "react";

import { EMOJI, urlDoEmoji } from "~/features/expressao/lib/twemoji";
import { cn } from "~/lib/utils";

interface Props {
  text: string;
  fontFamily?: string;
  className?: string;
}

const EmojiText: React.FC<{ emoji: string }> = ({ emoji }) => {
  const [withoutDrawing, setWithoutDrawing] = React.useState(false);

  React.useEffect(() => setWithoutDrawing(false), [emoji]);

  if (withoutDrawing) return <>{emoji}</>;

  return (
    <span data-gc="conversa.espelho-do-compositor.span" className="relative text-transparent">
      {emoji}
      <img data-gc="conversa.espelho-do-compositor.img"
        src={urlDoEmoji(emoji)}
        alt=""
        aria-hidden
        onError={() => setWithoutDrawing(true)}
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
    </span>
  );
};

export const ComposerMirror = React.forwardRef<HTMLDivElement, Props>(
  ({ text, fontFamily, className }, ref) => {
    const parts: React.ReactNode[] = [];
    let last = 0;

    for (const match of text.matchAll(EMOJI)) {
      const start = match.index!;
      if (start > last) parts.push(text.slice(last, start));
      parts.push(<EmojiText data-gc="conversa.espelho-do-compositor.emoji-text" key={start} emoji={match[0]} />);
      last = start + match[0].length;
    }

    if (last < text.length) parts.push(text.slice(last));
    if (text.endsWith("\n")) parts.push("​");

    return (
      <div data-gc="conversa.espelho-do-compositor.div"
        ref={ref}
        aria-hidden
        style={{ fontFamily }}
        className={cn(
          "pointer-events-none absolute inset-0 select-none overflow-hidden whitespace-pre-wrap break-words text-ink",
          className,
        )}
      >
        {parts}
      </div>
    );
  },
);

ComposerMirror.displayName = "EspelhoDoCompositor";
