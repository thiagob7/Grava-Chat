import { create } from "zustand";

let atual: HTMLAudioElement | null = null;

export const useSomDoPainel = create<{ quem: string | null }>(() => ({ quem: null }));

export function tocarSomDoPainel(url: string, volume: number, userId: string) {
  pararSomDoPainel();

  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));

  const soltar = () => {
    if (atual !== audio) return;

    atual = null;
    useSomDoPainel.setState({ quem: null });
  };

  audio.addEventListener("ended", soltar);

  atual = audio;
  useSomDoPainel.setState({ quem: userId });

  void audio.play().catch(soltar);
}

export function pararSomDoPainel() {
  if (!atual) return;

  atual.pause();
  atual.currentTime = 0;
  atual = null;
  useSomDoPainel.setState({ quem: null });
}
