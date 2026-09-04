import { useEffect, useState } from "react";

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

export const nomeDoDispositivo = (dispositivo: MediaDeviceInfo, indice: number, tipo: string) =>
  dispositivo.label || `${tipo} ${indice + 1}`;
