import { lerCabecalhoDoTema, type TemaCompartilhado } from "@gravae/shared";

import { AppError, NotFoundError } from "~/lib/http.js";
import { prisma } from "~/lib/prisma.js";
import type { PublicarTemaInput } from "~/validations/tema.js";

const TEMAS_POR_PESSOA = 50;

type TemaComAutor = {
  id: string;
  nome: string;
  descricao: string | null;
  autor: string | null;
  versao: string | null;
  tags: string[];
  css: string;
  substituicoes: unknown;
  createdAt: Date;
  usuario: { id: string; displayName: string; avatarUrl: string | null };
};

function serializar(tema: TemaComAutor): TemaCompartilhado {
  return {
    id: tema.id,
    nome: tema.nome,
    descricao: tema.descricao,
    autor: tema.autor,
    versao: tema.versao,
    tags: tema.tags,
    css: tema.css,
    substituicoes: (tema.substituicoes ?? {}) as Record<string, string>,
    publicadoPor: tema.usuario,
    createdAt: tema.createdAt.toISOString(),
  };
}

const AUTOR = { select: { id: true, displayName: true, avatarUrl: true } };

export const temaService = {
  async publicar(userId: string, entrada: PublicarTemaInput): Promise<TemaCompartilhado> {
    const temNada = !entrada.css.trim() && Object.keys(entrada.substituicoes).length === 0;
    if (temNada) throw new AppError("Não há nada no tema para compartilhar", 400);

    const quantos = await prisma.tema.count({ where: { autorId: userId } });
    if (quantos >= TEMAS_POR_PESSOA) {
      throw new AppError(
        `Você já publicou ${TEMAS_POR_PESSOA} temas. Apague um antes de publicar outro.`,
        409,
      );
    }

    const cabecalho = lerCabecalhoDoTema(entrada.css);

    const tema = await prisma.tema.create({
      data: {
        nome: entrada.nome ?? cabecalho.nome ?? "Tema sem nome",
        descricao: cabecalho.descricao,
        autor: cabecalho.autor,
        versao: cabecalho.versao,
        tags: cabecalho.tags,
        css: entrada.css,
        substituicoes: entrada.substituicoes,
        autorId: userId,
      },
      include: { usuario: AUTOR },
    });

    return serializar(tema);
  },

  async buscar(temaId: string): Promise<TemaCompartilhado> {
    const tema = await prisma.tema.findUnique({
      where: { id: temaId },
      include: { usuario: AUTOR },
    });

    if (!tema) throw new NotFoundError("Tema não encontrado");

    return serializar(tema);
  },

  async meus(userId: string): Promise<TemaCompartilhado[]> {
    const temas = await prisma.tema.findMany({
      where: { autorId: userId },
      include: { usuario: AUTOR },
      orderBy: { createdAt: "desc" },
    });

    return temas.map(serializar);
  },

  async apagar(userId: string, temaId: string) {
    const tema = await prisma.tema.findUnique({ where: { id: temaId } });

    if (!tema) throw new NotFoundError("Tema não encontrado");
    if (tema.autorId !== userId) throw new AppError("Esse tema não é seu", 403);

    await prisma.tema.delete({ where: { id: temaId } });
  },
};
