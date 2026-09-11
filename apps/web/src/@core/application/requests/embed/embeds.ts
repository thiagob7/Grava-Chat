import { api } from "~/@core/lib/api";

export interface EmbedModel {
  url: string;
  kind: "link" | "video" | "imagem";
  site: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  favicon: string | null;
  author: string | null;
  player: string | null;
  color: string | null;
  width: number | null;
  height: number | null;
}

export async function findEmbed(url: string): Promise<EmbedModel | null> {
  const response = await api.get<{ embed: EmbedModel | null }>("/embeds", { params: { url } });
  return response.data.embed;
}
