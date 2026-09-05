import React from "react";

import { EMOJI, urlDoEmoji } from "~/features/expressao/lib/twemoji";
import { cn } from "~/lib/utils";

interface Props {
  texto: string;
  fontFamily?: string;
  className?: string;
}

const EmojiNoTexto: React.FC<{ emoji: string }> = ({ emoji }) => {
  const [semDesenho, setSemDesenho] = React.useState(false);

  React.useEffect(() => setSemDesenho(false), [emoji]);

  if (semDesenho) return <>{emoji}</>;

  return (
    <span data-gc="conversa.espelho-do-compositor.span" className="relative text-transparent">
      {emoji}
      <img data-gc="conversa.espelho-do-compositor.img"
        src={urlDoEmoji(emoji)}
        alt=""
        aria-hidden
        onError={() => setSemDesenho(true)}
        className="pointer-events-none absolute inset-0 size-full object-contain"
      />
    </span>
  );
};

export const EspelhoDoCompositor = React.forwardRef<HTMLDivElement, Props>(
  ({ texto, fontFamily, className }, ref) => {
    const partes: React.ReactNode[] = [];
    let ultimo = 0;

    for (const achado of texto.matchAll(EMOJI)) {
      const inicio = achado.index!;
      if (inicio > ultimo) partes.push(texto.slice(ultimo, inicio));
      partes.push(<EmojiNoTexto data-gc="conversa.espelho-do-compositor.emoji-no-texto" key={inicio} emoji={achado[0]} />);
      ultimo = inicio + achado[0].length;
    }

    if (ultimo < texto.length) partes.push(texto.slice(ultimo));
    if (texto.endsWith("\n")) partes.push("​");

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
        {partes}
      </div>
    );
  },
);

EspelhoDoCompositor.displayName = "EspelhoDoCompositor";
