import type { UpdateProfileInput } from "~/validations/auth.js";
import { AppError } from "~/lib/http.js";
import { redis } from "~/lib/redis.js";
import { memberRepository, tagRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

const JANELA_S = 2;
const POR_JANELA = 10;

export const meService = {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    await respeitarVazao(userId);

    if (input.perfil?.tagGuildId) {
      await requirePodeVestirEtiqueta(userId, input.perfil.tagGuildId);
    }

    return userRepository.update(userId, {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.perfil !== undefined ? { perfil: input.perfil ?? { unset: true } } : {}),
      ...(input.statusPersonalizado !== undefined
        ? {
            statusPersonalizado: input.statusPersonalizado
              ? {
                  texto: input.statusPersonalizado.texto,
                  emoji: input.statusPersonalizado.emoji ?? null,
                  expiraEm: input.statusPersonalizado.expiraEm
                    ? new Date(input.statusPersonalizado.expiraEm)
                    : null,
                }
              : { unset: true },
          }
        : {}),
    });
  },
};

async function requirePodeVestirEtiqueta(userId: string, guildId: string) {
  const membro = await memberRepository.find(guildId, userId);
  if (!membro) throw new AppError("Você não é membro desse servidor");

  const etiquetas = await tagRepository.resolverMuitas([guildId]);
  if (!etiquetas.has(guildId)) throw new AppError("Esse servidor não tem etiqueta");
}

async function respeitarVazao(userId: string) {
  const chave = `me:rate:${userId}`;
  const usos = await redis.incr(chave);

  if (usos === 1) await redis.expire(chave, JANELA_S);
  if (usos > POR_JANELA) throw new AppError("Devagar — muitas alterações seguidas", 429);
}
