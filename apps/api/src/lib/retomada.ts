
export function isOtherTab(params: {
  resuming: boolean;
  anterior: { channelId: string; clientId: string | null; orphanedAt: number | null } | null;
  channelRequest: string;
  client: string | null;
}): boolean {
  const { resuming, anterior, channelRequest, client } = params;

  if (!resuming || !anterior) return false;
  if (anterior.channelId !== channelRequest) return false;

  if (anterior.orphanedAt) return false;

  if (client && anterior.clientId && client === anterior.clientId) return false;

  return true;
}
