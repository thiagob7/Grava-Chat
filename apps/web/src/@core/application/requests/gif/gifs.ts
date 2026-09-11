import { api } from "~/@core/lib/api";

export interface GifModel {
  id: string;
  description: string;
  url: string;
  preview: string;
  width: number;
  height: number;
}

export async function findGifConfig(): Promise<{ available: boolean }> {
  const response = await api.get<{ available: boolean }>("/gifs/config");
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

export interface GifModelCategory {
  term: string;
  name: string;
  preview: string;
}

export async function findGifCategories(): Promise<GifModelCategory[]> {
  const response = await api.get<GifModelCategory[]>("/gifs/categorias");
  return response.data;
}

export async function findFavoriteGifs(): Promise<GifModel[]> {
  const response = await api.get<GifModel[]>("/gifs/favoritos");
  return response.data;
}

export async function saveFavoriteGif(gif: GifModel): Promise<GifModel[]> {
  const response = await api.post<GifModel[]>("/gifs/favoritos", gif);
  return response.data;
}

export async function removeFavoriteGif(gifId: string): Promise<GifModel[]> {
  const response = await api.delete<GifModel[]>(`/gifs/favoritos/${gifId}`);
  return response.data;
}
