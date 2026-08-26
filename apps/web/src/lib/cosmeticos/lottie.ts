import { useCallback, useEffect, useRef, type RefObject } from "react";

interface Player {
  destroy: () => void;
  goToAndStop: (v: number, f?: boolean) => void;
  playSegments: (s: [number, number], forcar?: boolean) => void;
  resetSegments: (forcar?: boolean) => void;
  totalFrames: number;
}

interface Opcoes {
  chave: string;
  carregar: () => Promise<unknown | null>;
  animar: boolean;
  repetir: boolean;
  segmento?: [number, number];
}

export function usarLottie(
  caixa: RefObject<HTMLElement | null>,
  { chave, carregar, animar, repetir, segmento }: Opcoes,
) {
  const [de, ate] = segmento ?? [];

  const player = useRef<Player | null>(null);
  const comprimento = useRef(0);

  const desejo = useRef({ animar, de, ate });
  desejo.current = { animar, de, ate };

  const aplicar = useCallback(() => {
    const p = player.current;
    if (!p) return;

    const alvo = desejo.current;

    if (!alvo.animar) {
      p.resetSegments(true);
      p.goToAndStop(Math.max(0, comprimento.current - 1), true);
      return;
    }

    p.playSegments([alvo.de ?? 0, alvo.ate ?? comprimento.current], true);
  }, []);

  useEffect(() => {
    let vivo = true;

    void (async () => {
      const [lottie, dados] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        carregar(),
      ]);

      if (!vivo || !caixa.current || !dados) return;

      const novo = lottie.default.loadAnimation({
        container: caixa.current,
        renderer: "svg",
        loop: repetir,
        autoplay: false,
        animationData: structuredClone(dados),
      }) as Player;

      player.current = novo;
      comprimento.current = novo.totalFrames;
      aplicar();
    })();

    return () => {
      vivo = false;
      player.current?.destroy();
      player.current = null;
    };
  }, [caixa, chave, repetir, aplicar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => aplicar(), [animar, de, ate, aplicar]);
}
