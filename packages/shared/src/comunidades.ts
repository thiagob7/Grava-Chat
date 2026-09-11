export const MEMBERS_FOR_DISCOVER = 100;

export const MEMBERS_FOR_COMMUNITY = 80;

export function canFlipCommunity(members: number): boolean {
  return members >= MEMBERS_FOR_COMMUNITY;
}

export interface CommunitySettings {
  verifiedRequiresEmail: boolean;
  filtersMediaExplicit: boolean;
  rulesChannelId: string | null;
  noticesChannelId: string | null;
  securityChannelId: string | null;
  languagePrincipal: string | null;
}

export interface CommunityState extends CommunitySettings {
  community: boolean;
  communitySince: string | null;
  members: number;
  missing: number;
}

export function isDiscoverable(discoverable: boolean | null | undefined, members: number): boolean {
  return discoverable !== false && members >= MEMBERS_FOR_DISCOVER;
}

export const COMMUNITY_CATEGORIES = [
  "GAMES",
  "MUSICA",
  "ENTRETENIMENTO",
  "EDUCACAO",
  "CIENCIA_E_TECNOLOGIA",
  "CRIADOR_DE_CONTEUDO",
  "ANIME_E_MANGA",
  "FILMES_E_SERIES",
  "OUTRA",
] as const;

export type CommunityCategory = (typeof COMMUNITY_CATEGORIES)[number];

export const CATEGORY_NAMES: Record<CommunityCategory, string> = {
  GAMES: "Games",
  MUSICA: "Música",
  ENTRETENIMENTO: "Entretenimento",
  EDUCACAO: "Educação",
  CIENCIA_E_TECNOLOGIA: "Ciência e tecnologia",
  CRIADOR_DE_CONTEUDO: "Criador de conteúdo",
  ANIME_E_MANGA: "Anime e mangá",
  FILMES_E_SERIES: "Filmes e séries",
  OUTRA: "Outra",
};

export interface CommunityDiscovery {
  id: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  category: CommunityCategory | null;
  members: number;
  online: number;
  alreadyAmMember: boolean;
  verified: boolean;
}
