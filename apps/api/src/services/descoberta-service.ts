import {
  CATEGORIAS_DE_COMUNIDADE,
  MEMBROS_PARA_DESCOBRIR,
  type CategoriaDeComunidade,
  type ComunidadeDescoberta,
} from "@gravae/shared";

import { AppError } from "~/lib/http.js";
import { banRepository } from "~/repositories/ban-repository.js";
import { descobertaRepository, memberRepository } from "~/repositories/guild-repository.js";
import { presenceService } from "~/services/presence-service.js";
import { toMember } from "~/lib/serialize.js";

const ehCategoria = (valor: string | null): valor is CategoriaDeComunidade =>
  valor !== null && (CATEGORIAS_DE_COMUNIDADE as readonly string[]).includes(valor);

export const descobertaService = {
  async listar(
    userId: string,
    filtro: { categoria?: string; busca?: string },
  ): Promise<ComunidadeDescoberta[]> {
    const categoria = ehCategoria(filtro.categoria ?? null) ? filtro.categoria! : null;
    const busca = filtro.busca?.trim() || null;

    const candidatas = await descobertaRepository.candidatas(categoria, busca);

    const grandes = candidatas.filter(
      (guild) => guild._count.members >= MEMBROS_PARA_DESCOBRIR,
    );

    if (!grandes.length) return [];

    const membrosPorServidor = await descobertaRepository.membrosDe(
      grandes.map((guild) => guild.id),
    );

    const todosOsMembros = [...new Set([...membrosPorServidor.values()].flat())];
    const presenca = await presenceService.mapFor(todosOsMembros);

    return grandes
      .map((guild) => {
        const membros = membrosPorServidor.get(guild.id) ?? [];

        return {
          id: guild.id,
          name: guild.name,
          iconUrl: guild.iconUrl,
          bannerUrl: guild.bannerUrl,
          description: guild.description,
          categoria: ehCategoria(guild.categoria) ? guild.categoria : null,
          membros: guild._count.members,
          online: membros.filter((id) => presenca[id] && presenca[id] !== "OFFLINE").length,
          jaSouMembro: membros.includes(userId),
        };
      })
      .sort((a, b) => b.membros - a.membros);
  },

  async entrar(userId: string, guildId: string) {
    const candidatas = await descobertaRepository.candidatas(null, null);

    const aberta = candidatas.find(
      (guild) => guild.id === guildId && guild._count.members >= MEMBROS_PARA_DESCOBRIR,
    );

    if (!aberta) throw new AppError("Esta comunidade não está no Explorar", 404);

    if (await banRepository.find(guildId, userId)) {
      throw new AppError("Você está banido deste servidor", 403);
    }

    const existente = await memberRepository.find(guildId, userId);
    if (existente) return { guildId, jaEraMembro: true as const, member: null };

    const membro = await memberRepository.create({ guildId, userId });

    return { guildId, jaEraMembro: false as const, member: toMember(membro) };
  },
};
