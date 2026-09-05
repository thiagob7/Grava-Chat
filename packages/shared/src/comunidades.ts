/// Quantos membros um servidor precisa ter para aparecer no Explorar.
export const MEMBROS_PARA_DESCOBRIR = 100;

export const CATEGORIAS_DE_COMUNIDADE = [
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

export type CategoriaDeComunidade = (typeof CATEGORIAS_DE_COMUNIDADE)[number];

export const NOMES_DE_CATEGORIA: Record<CategoriaDeComunidade, string> = {
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

export interface ComunidadeDescoberta {
  id: string;
  name: string;
  iconUrl: string | null;
  bannerUrl: string | null;
  description: string | null;
  categoria: CategoriaDeComunidade | null;
  membros: number;
  online: number;
  jaSouMembro: boolean;
}
