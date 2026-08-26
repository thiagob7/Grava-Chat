import type { Emblema } from "@gravae/shared";
import { LIMITS } from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import { emblemaRepository, memberRepository } from "~/repositories/guild-repository.js";
import { accessService } from "./access-service.js";
import { auditService } from "./audit-service.js";

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

  async vestir(userId: string, guildId: string, emblemIds: string[]) {
    const membro = await accessService.requireMember(userId, guildId);

    if (emblemIds.length > LIMITS.emblemasPorMembro) {
      throw new AppError(`No maximo ${LIMITS.emblemasPorMembro} emblemas de uma vez`);
    }

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
