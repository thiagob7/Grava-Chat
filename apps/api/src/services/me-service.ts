import type { UpdateProfileInput } from "~/validations/auth.js";
import { AppError } from "~/lib/http.js";
import { redis } from "~/lib/redis.js";
import { memberRepository, tagRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

/**
 * O seu próprio perfil.
 *
 * Existe porque `PATCH /me` chamava o repositório direto, sem service — não
 * havia onde pendurar normalização, limite de vazão nem o aviso pros outros.
 * Com enfeite e status personalizado isso deixou de ser detalhe de estilo.
 */

/**
 * Um seletor de cor dispara uma requisição a cada arrasto do mouse. Sem freio,
 * escolher um tom vira dezenas de escritas no banco e dezenas de broadcasts
 * pra todos os servidores da pessoa.
 */
const JANELA_S = 2;
const POR_JANELA = 10;

export const meService = {
  async updateProfile(userId: string, input: UpdateProfileInput) {
    await respeitarVazao(userId);

    /**
     * A etiqueta escolhida tem que ser de um servidor onde você ESTÁ e que TEM
     * etiqueta. Sem essa checagem, qualquer cliente vestiria a etiqueta de um
     * servidor de que nunca participou — e ela aparece ao lado do nome em todo
     * lugar, o que é exatamente o material de um golpe de identidade.
     */
    if (input.perfil?.tagGuildId) {
      await requirePodeVestirEtiqueta(userId, input.perfil.tagGuildId);
    }

    /**
     * `perfil: null` significa "voltar ao padrão" e tem que APAGAR o documento
     * embutido — mandar `{}` deixaria um objeto vazio no banco que o
     * serializador teria que aprender a ignorar.
     */
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
