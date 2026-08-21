import { api } from "~/@core/lib/api";

export interface GifModel {
  id: string;
  descricao: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

export async function findGifConfig(): Promise<{ disponivel: boolean }> {
  const response = await api.get<{ disponivel: boolean }>("/gifs/config");
  return response.data;
}

export async function findTrendingGifs(): Promise<GifModel[]> {
  const response = await api.get<GifModel[]>("/gifs/alta");
  return response.data;
}

export async function searchGifs(q: string): Promise<GifModel[]> {
  const response = await api.get<GifModel[]>("/gifs/busca", { params: { q } });
  return response.data;
}
