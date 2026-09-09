import type { EventFrequency, GuildEvent } from "@gravae/shared";
import { api } from "~/@core/lib/api";

export interface GuildEventInput {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  startsAt: string;
  frequency: EventFrequency;
  channelId?: string | null;
  externalLocation?: string | null;
}

export interface InterestResult {
  id: string;
  interestedCount: number;
  isInterested: boolean;
}

export async function findEvents(guildId: string): Promise<GuildEvent[]> {
  const response = await api.get<GuildEvent[]>(`/guilds/${guildId}/events`);
  return response.data;
}

export async function createEvent(guildId: string, input: GuildEventInput) {
  const response = await api.post<GuildEvent>(`/guilds/${guildId}/events`, input);
  return response.data;
}

export async function cancelEvent(guildId: string, eventId: string) {
  await api.delete(`/guilds/${guildId}/events/${eventId}`);
}

export async function setEventInterest(guildId: string, eventId: string, interested: boolean) {
  const response = await api.put<InterestResult>(
    `/guilds/${guildId}/events/${eventId}/interest`,
    { interested },
  );
  return response.data;
}
