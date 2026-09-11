import type { Permission } from "@gravae/shared";

import type { PublicUserModel } from "~/@core/domain/models/user-model";
import { api } from "~/@core/lib/api";

export interface BotModel {
  id: string;
  user: PublicUserModel;
  description: string | null;
  coverUrl: string | null;
  categories: string[];
  languages: string[];
  termsUrl: string | null;
  policyUrl: string | null;
  supportServerId: string | null;
  permissionsRequested: Permission[];
  isPublic: boolean;
  redirectUris: string[];
  clientSecret: string;
  createdAt: string;
  token?: string;
}

export type InviteBotModel = Omit<
  BotModel,
  | "createdAt"
  | "token"
  | "clientSecret"
  | "redirectUris"
  | "coverUrl"
  | "categories"
  | "languages"
  | "termsUrl"
  | "policyUrl"
  | "supportServerId"
>;

export interface BotModelServer {
  id: string;
  name: string;
  iconUrl: string | null;
}

export async function findBots(): Promise<BotModel[]> {
  const response = await api.get<BotModel[]>("/bots");
  return response.data;
}

export async function createBot(name: string): Promise<BotModel> {
  const response = await api.post<BotModel>("/bots", { name });
  return response.data;
}

export interface EditBotInput {
  name?: string;
  description?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  categories?: string[];
  languages?: string[];
  termsUrl?: string | null;
  policyUrl?: string | null;
  supportServerId?: string | null;
  permissionsRequested?: Permission[];
  isPublic?: boolean;
  redirectUris?: string[];
}

export async function updateBot(botId: string, data: EditBotInput): Promise<BotModel> {
  const response = await api.patch<BotModel>(`/bots/${botId}`, data);
  return response.data;
}

export async function regenerateBotToken(botId: string): Promise<BotModel> {
  const response = await api.post<BotModel>(`/bots/${botId}/token`);
  return response.data;
}

export async function deleteBot(botId: string): Promise<void> {
  await api.delete(`/bots/${botId}`);
}

export async function findBotInvite(botId: string): Promise<InviteBotModel> {
  const response = await api.get<InviteBotModel>(`/bots/${botId}/convite`);
  return response.data;
}

export interface BotModelDestinations {
  destinations: BotModelServer[];
  serversTotal: number;
  alreadyThisAt: number;
}

export async function findBotDestinations(botId: string): Promise<BotModelDestinations> {
  const response = await api.get<BotModelDestinations>(`/bots/${botId}/destinos`);
  return response.data;
}

export async function findBotGuilds(botId: string): Promise<BotModelServer[]> {
  const response = await api.get<BotModelServer[]>(`/bots/${botId}/servidores`);
  return response.data;
}

export async function addBotToGuild(botId: string, guildId: string): Promise<void> {
  await api.put(`/bots/${botId}/servidores/${guildId}`);
}

export async function removeBotFromGuild(botId: string, guildId: string): Promise<void> {
  await api.delete(`/bots/${botId}/servidores/${guildId}`);
}
