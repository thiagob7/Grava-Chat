import type { Emblema } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { emblemaRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "./access-service.js";
import { auditService } from "./audit-service.js";

/**
 * Os emblemas do servidor.
 *
 * A divisao de poder e o ponto: **criar** exige `MANAGE_GUILD`, **vestir** nao
 * exige nada alem de ser membro. Foi o pedido explicito — quem quiser colocar,
 * coloca. Emblema com concessao viraria fila de pedido no ouvido do dono, e a
 * graca aqui e a pessoa se identificar com o grupo sem pedir licenca.
 */
export const emblemaService = {
  async listar(userId: string, guildId: string): Promise<Emblema[]> {
    await accessService.requireMember(userId, guildId);
    return (await emblemaRepository.findManyByGuild(guildId)).map(paraDto);
  },

  async criar(
    userId: string,
    guildId: string,
    input: { nome: string; emoji?: string | null; iconUrl?: string | null },
  ): Promise<Emblema> {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const quantos = await emblemaRepository.countByGuild(guildId);
    if (quantos >= LIMITS.emblemasPorServidor) {
      throw new AppError(`Este servidor ja tem ${LIMITS.emblemasPorServidor} emblemas`);
    }

    /**
     * Emoji OU imagem, resolvido AQUI e nao por `.refine()` no schema: a rota e
     * parcial, entao o validador nao enxerga o estado atual e recusaria uma
     * troca legitima de um pelo outro.
     */
    const emoji = input.emoji?.trim() || null;
    const iconUrl = emoji ? null : (input.iconUrl ?? null);
    if (!emoji && !iconUrl) throw new AppError("O emblema precisa de um emoji ou de uma imagem");

    const criado = await emblemaRepository.create({
      guildId,
      nome: input.nome.trim(),
      emoji,
      iconUrl,
      createdById: userId,
    });

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "emblema.create",
      targetType: "emblema",
      targetId: criado.id,
      targetName: criado.nome,
    });

    return paraDto(criado);
  },

  async remover(userId: string, guildId: string, emblemaId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const emblema = await emblemaRepository.findById(emblemaId);
    if (!emblema || emblema.guildId !== guildId) throw new NotFoundError("Emblema nao encontrado");

    await emblemaRepository.remove(emblemaId);
    /**
     * Tira o emblema apagado de quem o vestia. Sem isso o id ficaria pendurado
     * em cada membro e o front teria que aprender a ignorar id que nao resolve —
     * um "as vezes some, as vezes fica" que ninguem consegue reproduzir.
     */
    await memberRepository.removerEmblemaDeTodos(guildId, emblemaId);

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "emblema.delete",
      targetType: "emblema",
      targetId: emblemaId,
      targetName: emblema.nome,
    });

    return { id: emblemaId };
  },

  /** O que EU visto neste servidor. Membro comum decide sozinho. */
  async vestir(userId: string, guildId: string, emblemIds: string[]) {
    const membro = await accessService.requireMember(userId, guildId);

    if (emblemIds.length > LIMITS.emblemasPorMembro) {
      throw new AppError(`No maximo ${LIMITS.emblemasPorMembro} emblemas de uma vez`);
    }

    // so vale emblema DESTE servidor: senao dava pra vestir o de outro
    const doServidor = new Set((await emblemaRepository.findManyByGuild(guildId)).map((e) => e.id));
    const escolhidos = [...new Set(emblemIds)].filter((id) => doServidor.has(id));

    await memberRepository.definirEmblemas(membro.id, escolhidos);
    return { emblemIds: escolhidos };
  },
};

const paraDto = (e: {
  id: string;
  guildId: string;
  nome: string;
  emoji: string | null;
  iconUrl: string | null;
}): Emblema => ({
  id: e.id,
  guildId: e.guildId,
  nome: e.nome,
  emoji: e.emoji,
  iconUrl: e.iconUrl,
});
