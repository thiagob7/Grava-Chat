import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

export function useTelaCheia(alvo?: React.RefObject<HTMLElement | null>) {
  const [ativa, setAtiva] = useState(false);

  useEffect(() => {
    const sincronizar = () => setAtiva(Boolean(document.fullscreenElement));

    sincronizar();
    document.addEventListener("fullscreenchange", sincronizar);
    return () => document.removeEventListener("fullscreenchange", sincronizar);
  }, []);

  const alternar = useCallback(async () => {
    try {
      if (document.fullscreenElement) return void (await document.exitFullscreen());

      if (!document.fullscreenEnabled) {
        toast.error("Este navegador não está permitindo tela cheia aqui.");
        return;
      }

      await (alvo?.current ?? document.documentElement).requestFullscreen();
    } catch (erro) {
      const motivo = erro instanceof Error ? erro.message : String(erro);
      toast.error(`Não consegui abrir em tela cheia: ${motivo}`);
    }
  }, [alvo]);

  return { ativa, alternar };
}
