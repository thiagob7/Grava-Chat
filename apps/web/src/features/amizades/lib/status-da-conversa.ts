
export type StatusKind = "chamada" | "voz";

export interface ChatStatus {
  key: string;
  kind: StatusKind;
}

export function chatStatus({
  inCallWithMe,
  inVoiceServer,
}: {
  inCallWithMe: boolean;
  inVoiceServer: boolean;
}): ChatStatus | null {
  if (inCallWithMe) return { key: "amizades.status.emChamada", kind: "chamada" };
  if (inVoiceServer) return { key: "amizades.status.emVoz", kind: "voz" };

  return null;
}
