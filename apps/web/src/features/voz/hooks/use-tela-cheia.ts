import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useScreenFull(target?: React.RefObject<HTMLElement | null>) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => setActive(Boolean(document.fullscreenElement));

    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  const toggle = useCallback(async () => {
    try {
      if (document.fullscreenElement) return void (await document.exitFullscreen());

      if (!document.fullscreenEnabled) {
        toast.error("Este navegador não está permitindo tela cheia aqui.");
        return;
      }

      await (target?.current ?? document.documentElement).requestFullscreen();
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      toast.error(`Não consegui abrir em tela cheia: ${reason}`);
    }
  }, [target]);

  return { active, toggle };
}
