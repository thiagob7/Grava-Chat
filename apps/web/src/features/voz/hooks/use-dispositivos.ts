import { useEffect, useState } from "react";

export function useDevices(active = true) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!active || !navigator.mediaDevices?.enumerateDevices) return;

    const list = () => {
      void navigator.mediaDevices
        .enumerateDevices()
        .then(setDevices)
        .catch(() => setDevices([]));
    };

    list();
    navigator.mediaDevices.addEventListener("devicechange", list);
    return () => navigator.mediaDevices.removeEventListener("devicechange", list);
  }, [active]);

  return {
    entries: devices.filter((d) => d.kind === "audioinput"),
    outputs: devices.filter((d) => d.kind === "audiooutput"),
    cameras: devices.filter((d) => d.kind === "videoinput"),
  };
}

export const deviceName = (device: MediaDeviceInfo, index: number, kind: string) =>
  device.label || `${kind} ${index + 1}`;
