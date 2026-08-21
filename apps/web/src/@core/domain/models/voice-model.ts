export interface VoiceTokenModel {
  /** URL do SFU (LiveKit) */
  url: string;
  /** JWT com o grant da sala daquele canal — é ele que autoriza a entrada */
  token: string;
}
