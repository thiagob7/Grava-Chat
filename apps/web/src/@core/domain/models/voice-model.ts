export interface VoiceTokenModel {
  /** URL do SFU (LiveKit) */
  url: string;
  /** JWT com o grant da sala daquele canal — é ele que autoriza a entrada */
  token: string;
  /**
   * Sem `USE_VAD` a pessoa só fala apertando a tecla. Vem do servidor porque a
   * permissão mora lá — mas quem cumpre é o cliente: o SFU não sabe distinguir
   * áudio de detecção de voz do de push-to-talk.
   */
  exigePushToTalk?: boolean;
}
