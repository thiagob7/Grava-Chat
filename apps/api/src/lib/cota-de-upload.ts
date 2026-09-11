
export const QUOTA_BY_HOUR = 500 * 1024 * 1024;

export const QUOTA_S_WINDOW = 3600;

export interface SendingRequest {
  alreadyUsed: number;
  size: number;
  quota?: number;
}

export function fitsQuota({ alreadyUsed, size, quota = QUOTA_BY_HOUR }: SendingRequest): boolean {
  return alreadyUsed + size <= quota;
}

const mb = (bytes: number) => Math.round(bytes / 1024 / 1024);

export function quotaMessage({ alreadyUsed, quota = QUOTA_BY_HOUR }: Omit<SendingRequest, "size">) {
  const remaining = Math.max(0, quota - alreadyUsed);

  return `Você atingiu o limite de ${mb(quota)} MB de envio por hora (restam ${mb(remaining)} MB). Tente de novo mais tarde.`;
}
