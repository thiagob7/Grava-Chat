import { api } from "~/@core/lib/api";

export interface EmbedModel {
  url: string;
  tipo: "link" | "video" | "imagem";
  site: string | null;
  titulo: string | null;
  descricao: string | null;
  imagem: string | null;
  favicon: string | null;
  autor: string | null;
  /// endereço do tocador, quando o site tem um (YouTube e afins)
  player: string | null;
  /// o `theme-color` do site, para a faixa da esquerda
  cor: string | null;
  largura: number | null;
  altura: number | null;
}

export async function findEmbed(url: string): Promise<EmbedModel | null> {
  const response = await api.get<{ embed: EmbedModel | null }>("/embeds", { params: { url } });
  return response.data.embed;
}
