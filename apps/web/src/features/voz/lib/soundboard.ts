import { create } from "zustand";

let current: HTMLAudioElement | null = null;

export const usePanelSound = create<{ who: string | null }>(() => ({ who: null }));

export function playPanelSound(url: string, volume: number, userId: string) {
  stopPanelSound();

  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));

  const drop = () => {
    if (current !== audio) return;

    current = null;
    usePanelSound.setState({ who: null });
  };

  audio.addEventListener("ended", drop);

  current = audio;
  usePanelSound.setState({ who: userId });

  void audio.play().catch(drop);
}

export function stopPanelSound() {
  if (!current) return;

  current.pause();
  current.currentTime = 0;
  current = null;
  usePanelSound.setState({ who: null });
}
