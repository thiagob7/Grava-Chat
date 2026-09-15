import React from "react";

import { EMOJI, urlDoEmoji } from "~/features/expressao/lib/twemoji";
import { cn } from "~/lib/utils";
import { mentionPattern } from "~/features/conversa/lib/mention-labels";

interface Props {
  text: string;
  mentions?: string[];
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
  ({ text, mentions = [], fontFamily, className }, ref) => {
    const parts: React.ReactNode[] = [];
    const pattern = mentionPattern(mentions);

    const withMentions = (piece: string, key: number) => {
      if (!pattern) return [piece];

      const out: React.ReactNode[] = [];
      let from = 0;

      for (const match of piece.matchAll(pattern)) {
        const start = match.index!;
        if (start > from) out.push(piece.slice(from, start));
        out.push(
          <span data-gc="conversa.espelho-do-compositor.span--2"
            key={`${key}-${start}`}
            className="rounded-sm"
            style={{
              color: "var(--color-mencao)",
              backgroundColor: "color-mix(in srgb, var(--color-mencao) 15%, transparent)",
            }}
          >
            {match[0]}
          </span>,
        );
        from = start + match[0].length;
      }

      if (from < piece.length) out.push(piece.slice(from));
      return out;
    };

    let last = 0;

    for (const match of text.matchAll(EMOJI)) {
      const start = match.index!;
      if (start > last) parts.push(...withMentions(text.slice(last, start), last));
      parts.push(<EmojiText data-gc="conversa.espelho-do-compositor.emoji-text" key={start} emoji={match[0]} />);
      last = start + match[0].length;
    }

    if (last < text.length) parts.push(...withMentions(text.slice(last), last));
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
