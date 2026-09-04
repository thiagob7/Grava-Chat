import type { Permission } from "@gravae/shared";

import type { PublicUserModel } from "~/@core/domain/models/user-model";
import { api } from "~/@core/lib/api";

export interface BotModel {
  id: string;
  usuario: PublicUserModel;
  descricao: string | null;
  permissoesPedidas: Permission[];
  publico: boolean;
  redirectUris: string[];
  clientSecret: string;
  createdAt: string;
  token?: string;
}

export type ConviteDeBotModel = Omit<
  BotModel,
  "createdAt" | "token" | "clientSecret" | "redirectUris"
>;

export interface ServidorDoBotModel {
  id: string;
  name: string;
  iconUrl: string | null;
}

export async function findBots(): Promise<BotModel[]> {
  const response = await api.get<BotModel[]>("/bots");
  return response.data;
}

export async function createBot(nome: string): Promise<BotModel> {
  const response = await api.post<BotModel>("/bots", { nome });
  return response.data;
}

export interface EditarBotInput {
  nome?: string;
  descricao?: string | null;
  avatarUrl?: string | null;
  permissoesPedidas?: Permission[];
  publico?: boolean;
  redirectUris?: string[];
}

export async function updateBot(botId: string, dados: EditarBotInput): Promise<BotModel> {
  const response = await api.patch<BotModel>(`/bots/${botId}`, dados);
  return response.data;
}

export async function regenerateBotToken(botId: string): Promise<BotModel> {
  const response = await api.post<BotModel>(`/bots/${botId}/token`);
  return response.data;
}

export async function deleteBot(botId: string): Promise<void> {
  await api.delete(`/bots/${botId}`);
}

export async function findBotInvite(botId: string): Promise<ConviteDeBotModel> {
  const response = await api.get<ConviteDeBotModel>(`/bots/${botId}/convite`);
  return response.data;
}

export interface DestinosDoBotModel {
  destinos: ServidorDoBotModel[];
  totalDeServidores: number;
  jaEstaEm: number;
}

export async function findBotDestinations(botId: string): Promise<DestinosDoBotModel> {
  const response = await api.get<DestinosDoBotModel>(`/bots/${botId}/destinos`);
  return response.data;
}

export async function findBotGuilds(botId: string): Promise<ServidorDoBotModel[]> {
  const response = await api.get<ServidorDoBotModel[]>(`/bots/${botId}/servidores`);
  return response.data;
}

export async function addBotToGuild(botId: string, guildId: string): Promise<void> {
  await api.put(`/bots/${botId}/servidores/${guildId}`);
}

export async function removeBotFromGuild(botId: string, guildId: string): Promise<void> {
  await api.delete(`/bots/${botId}/servidores/${guildId}`);
}
