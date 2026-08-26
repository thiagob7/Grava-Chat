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

export interface CategoriaDeGifModel {
  termo: string;
  nome: string;
  preview: string;
}

export async function findGifCategories(): Promise<CategoriaDeGifModel[]> {
  const response = await api.get<CategoriaDeGifModel[]>("/gifs/categorias");
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
