import React from "react";

import { Emoji } from "~/features/expressao/components/Emoji";
import { loadEmojis } from "~/features/expressao/lib/emoji";
import { cn } from "~/lib/utils";

/*
  A carinha do botão que abre os emojis.

  Parada ela fica sem cor, como qualquer outro ícone da fileira; no ponteiro
  acende e troca de emoji. É o mesmo desenho que o app já serve, e não o do
  sistema, então a fileira não muda de cara entre um Mac e um Windows.

  O acervo inteiro só é buscado no primeiro ponteiro que chega, porque são umas
  centenas de quilobytes de JSON e ninguém deve baixar isso para ver um botão.
  Até ele chegar, o sorteio usa este punhado aqui.
*/
const START = [
  "😀", "😄", "😁", "😆", "😅", "😊", "🙂", "😉", "😍", "🤩",
  "😋", "😜", "🤪", "😎", "🥳", "🤔", "🤗", "😢", "😡", "🤯",
];

const raffle = (pool: string[], current: string) => {
  const others = pool.filter((one) => one !== current);

  return others[Math.floor(Math.random() * others.length)] ?? current;
};

export function usePickerFace() {
  const [pool, setPool] = React.useState<string[]>(START);
  const [face, setFace] = React.useState(
    () => START[Math.floor(Math.random() * START.length)]!,
  );
  const [lit, setLit] = React.useState(false);

  const enter = () => {
    setLit(true);
    setFace((current) => raffle(pool, current));

    if (pool !== START) return;

    void loadEmojis()
      .then((groups) => setPool(groups.flatMap((group) => group.emojis.map((one) => one.emoji))))
      .catch(() => undefined);
  };

  return { face, lit, enter, leave: () => setLit(false) };
}

export const PickerFace: React.FC<{
  face: string;
  lit: boolean;
  className?: string;
}> = ({ face, lit, className }) => (
  <Emoji data-gc="expressao.carinha-do-seletor.emoji"
    emoji={face}
    className={cn(
      "size-5 transition duration-150",
      lit ? "opacity-100 grayscale-0" : "opacity-70 grayscale",
      className,
    )}
  />
);
