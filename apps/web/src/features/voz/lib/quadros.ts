import type { VoiceTile } from "~/features/voz/stores/voice-store";

/*
  Por que isto existe.

  A chamada se redesenha a partir de treze eventos da sala, e dois deles —
  quem está falando e a qualidade da conexão — disparam várias vezes por
  segundo numa sala movimentada. Cada disparo montava uma lista nova, com
  objetos novos, mesmo quando nada tinha mudado.

  Para o React, objeto novo é dado novo. O resultado era todo mundo redesenhado
  o tempo todo, elemento de vídeo junto, e o notebook esquentando em chamada
  cheia.

  A comparação aqui devolve o que já existia sempre que o conteúdo é igual: a
  MESMA lista quando ninguém mudou, e os MESMOS quadros de quem não mudou
  quando alguém mudou. Assim o custo do redesenho passa a ser proporcional ao
  que mudou de verdade, e não ao tamanho da sala.

  As faixas entram na comparação por referência de propósito. Elas vêm do
  LiveKit e só trocam quando a publicação troca, que é exatamente quando o
  quadro precisa mesmo ser refeito.
*/
export function sameTile(a: VoiceTile, b: VoiceTile): boolean {
  return (
    a.identity === b.identity &&
    a.name === b.name &&
    a.avatarUrl === b.avatarUrl &&
    a.isLocal === b.isLocal &&
    a.speaking === b.speaking &&
    a.micEnabled === b.micEnabled &&
    a.quality === b.quality &&
    a.cameraOn === b.cameraOn &&
    a.sharingScreen === b.sharingScreen &&
    a.cameraTrack === b.cameraTrack &&
    a.screenTrack === b.screenTrack &&
    a.micTrack === b.micTrack &&
    a.screenAudioTrack === b.screenAudioTrack
  );
}

export function keepSteady(previous: VoiceTile[], next: VoiceTile[]): VoiceTile[] {
  if (previous.length !== next.length) return next;

  let changed = false;

  const settled = next.map((tile, i) => {
    const already = previous[i];

    if (already && sameTile(already, tile)) return already;

    changed = true;
    return tile;
  });

  return changed ? settled : previous;
}
