export interface VoiceTokenModel {
  url: string;
  token: string;
  requiresPushToTalk?: boolean;
  /** Em bits por segundo, escolhida pelo dono do canal. */
  bitrate?: number;
}
