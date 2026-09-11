import { useCallback, useEffect, useRef, type RefObject } from "react";

interface Player {
  destroy: () => void;
  goToAndStop: (v: number, f?: boolean) => void;
  playSegments: (s: [number, number], force?: boolean) => void;
  resetSegments: (force?: boolean) => void;
  totalFrames: number;
}

interface Options {
  key: string;
  load: () => Promise<unknown | null>;
  animate: boolean;
  repeat: boolean;
  segment?: [number, number];
}

export function useLottie(
  box: RefObject<HTMLElement | null>,
  { key, load, animate, repeat, segment }: Options,
) {
  const [de, until] = segment ?? [];

  const player = useRef<Player | null>(null);
  const length = useRef(0);

  const wish = useRef({ animate, de, until });
  wish.current = { animate, de, until };

  const apply = useCallback(() => {
    const p = player.current;
    if (!p) return;

    const target = wish.current;

    if (!target.animate) {
      p.resetSegments(true);
      p.goToAndStop(Math.max(0, length.current - 1), true);
      return;
    }

    p.playSegments([target.de ?? 0, target.until ?? length.current], true);
  }, []);

  useEffect(() => {
    let live = true;

    void (async () => {
      const [lottie, data] = await Promise.all([
        import("lottie-web/build/player/lottie_light"),
        load(),
      ]);

      if (!live || !box.current || !data) return;

      const fresh = lottie.default.loadAnimation({
        container: box.current,
        renderer: "svg",
        loop: repeat,
        autoplay: false,
        animationData: structuredClone(data),
      }) as Player;

      player.current = fresh;
      length.current = fresh.totalFrames;
      apply();
    })();

    return () => {
      live = false;
      player.current?.destroy();
      player.current = null;
    };
  }, [box, key, repeat, apply]); 

  useEffect(() => apply(), [animate, de, until, apply]);
}
