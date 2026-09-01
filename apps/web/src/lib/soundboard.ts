import { create } from "zustand";

/**
 * O tocador dos sons do painel.
 *
 * Um de cada vez, e não um `new Audio()` solto por evento. Antes, apertar o
 * mesmo som cinco vezes empilhava cinco áudios tocando juntos — e ninguém
 * conseguia calar nenhum, porque cada um só existia dentro do seu `onVoiceSound`.
 * Aqui o som novo corta o que estava tocando, e o `parar()` alcança todos.
 */

let atual: HTMLAudioElement | null = null;

/**
 * De quem é o som que está tocando agora.
 *
 * Serve pro anel verde: apertar um som não move o microfone de ninguém, então
 * o LiveKit não tem o que reportar e o rosto de quem apertou ficava parado
 * enquanto a chamada inteira ouvia o áudio. Aqui a chamada sabe de quem veio,
 * e o rosto acende igual a quem está falando.
 *
 * Um por vez, como o tocador: é a mesma verdade contada de outro jeito.
 */
export const useSomDoPainel = create<{ quem: string | null }>(() => ({ quem: null }));

export function tocarSomDoPainel(url: string, volume: number, userId: string) {
  pararSomDoPainel();

  const audio = new Audio(url);
  audio.volume = Math.min(1, Math.max(0, volume));

  /// Só larga a referência se ela ainda for deste áudio: entre o play e o
  /// fim, outro som pode ter entrado no lugar.
  const soltar = () => {
    if (atual !== audio) return;

    atual = null;
    useSomDoPainel.setState({ quem: null });
  };

  audio.addEventListener("ended", soltar);

  atual = audio;
  useSomDoPainel.setState({ quem: userId });

  /// Navegador que recusa tocar (autoplay travado) não pode deixar o rosto
  /// aceso pra sempre.
  void audio.play().catch(soltar);
}

export function pararSomDoPainel() {
  if (!atual) return;

  atual.pause();
  atual.currentTime = 0;
  atual = null;
  useSomDoPainel.setState({ quem: null });
}
