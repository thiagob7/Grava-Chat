
export type Quality = "excellent" | "good" | "poor" | "lost" | "unknown" | string;

export interface QualityNotice {
  label: string;
  color: string;
  pulsing: boolean;
}

export function qualityNotice(quality: Quality): QualityNotice | null {
  if (quality === "poor") {
    return { label: "Conexão instável", color: "text-idle", pulsing: false };
  }

  if (quality === "lost") {
    return { label: "Conexão perdida", color: "text-danger", pulsing: true };
  }

  return null;
}
