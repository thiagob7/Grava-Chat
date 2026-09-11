import {
  themeWeight,
  type AppDiscovered,
  type AppPublic,
  type ThemeActive,
  type CommunityDiscovery,
  type GalleryTheme,
} from "@gravae/shared";

import { api } from "~/@core/lib/api";

/*
  Mesma prevenção do módulo de temas: a API pode ser mais velha que a tela.
  Sem o peso, `pesoLegivel` escrevia "NaN MB" no cartão; sem os ativos, a
  galeria quebrava na primeira leitura de `.length`.
*/
export type GalleryArrivedTheme = Omit<GalleryTheme, "actives" | "weightBytes"> & {
  actives?: ThemeActive[];
  weightBytes?: number;
};

export const normalizeGalleryTheme = (theme: GalleryArrivedTheme): GalleryTheme => {
  const actives = theme.actives ?? [];

  return { ...theme, actives, weightBytes: theme.weightBytes ?? themeWeight("", actives) };
};

export interface DiscoveryFilter {
  category?: string;
  search?: string;
}

export async function findCommunities(
  filter: DiscoveryFilter,
): Promise<CommunityDiscovery[]> {
  const response = await api.get<CommunityDiscovery[]>("/descobrir", { params: filter });
  return response.data;
}

export async function findGalleryThemes(search?: string): Promise<GalleryTheme[]> {
  const response = await api.get<GalleryArrivedTheme[]>("/descobrir/temas", {
    params: { search },
  });
  return response.data.map(normalizeGalleryTheme);
}

export async function findApps(
  search?: string,
  category?: string,
): Promise<AppDiscovered[]> {
  const response = await api.get<AppDiscovered[]>("/descobrir/aplicativos", {
    params: { search, category },
  });
  return response.data;
}

export async function joinCommunity(
  guildId: string,
): Promise<{ guildId: string; alreadyWasMember: boolean }> {
  const response = await api.post<{ guildId: string; alreadyWasMember: boolean }>(
    `/descobrir/${guildId}/entrar`,
  );
  return response.data;
}

export async function findApp(botId: string): Promise<AppPublic> {
  const response = await api.get<AppPublic>(`/descobrir/aplicativos/${botId}`);
  return response.data;
}

export async function reportApp(
  botId: string,
  data: { reason: string; details?: string },
): Promise<void> {
  await api.post(`/descobrir/aplicativos/${botId}/denuncias`, data);
}
