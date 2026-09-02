import { useEffect, useState } from "react";

/**
 * Os aparelhos de áudio e vídeo do sistema, sempre em dia.
 *
 * Estava dentro da tela de configurações, e por isso a barra da chamada — que
 * é onde se troca de fone no meio de uma conversa — não tinha como listar
 * nada. O `devicechange` importa mais do que parece: plugar um headset com a
 * lista já aberta é exatamente o momento em que a pessoa vai olhar.
 *
 * Sem permissão concedida o navegador devolve a lista sem `label`. Quem
 * mostra, mostra o que veio; quem não tem nome vira "Microfone 2".
 */
export function useDispositivos(ativo = true) {
  const [dispositivos, setDispositivos] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!ativo || !navigator.mediaDevices?.enumerateDevices) return;

    const listar = () => {
      void navigator.mediaDevices
        .enumerateDevices()
        .then(setDispositivos)
        .catch(() => setDispositivos([]));
    };

    listar();
    navigator.mediaDevices.addEventListener("devicechange", listar);
    return () => navigator.mediaDevices.removeEventListener("devicechange", listar);
  }, [ativo]);

  return {
    entradas: dispositivos.filter((d) => d.kind === "audioinput"),
    saidas: dispositivos.filter((d) => d.kind === "audiooutput"),
    cameras: dispositivos.filter((d) => d.kind === "videoinput"),
  };
}

/// O nome do aparelho, ou um apelido pela posição quando o navegador não conta.
export const nomeDoDispositivo = (dispositivo: MediaDeviceInfo, indice: number, tipo: string) =>
  dispositivo.label || `${tipo} ${indice + 1}`;
