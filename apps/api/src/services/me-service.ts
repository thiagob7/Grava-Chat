import { enderecoDaConexao, type EstiloDePerfil } from "@gravae/shared";

import type { UpdateProfileInput } from "~/validations/auth.js";
import { AppError } from "~/lib/http.js";
import { authService } from "./auth-service.js";
import { redis } from "~/lib/redis.js";
import { prisma } from "~/lib/prisma.js";
import {
  memberRepository,
  tagRepository,
} from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";

const JANELA_S = 2;
const POR_JANELA = 10;

const TETO_DE_MENSAGENS = 10_000;

const DIAS_DE_ARREPENDIMENTO = 15;

export const meService = {
  async pedirExclusao(userId: string) {
    const donoDe = await prisma.guild.findMany({
      where: { ownerId: userId },
      select: { name: true, _count: { select: { members: true } } },
    });

    const comGente = donoDe
      .filter((g) => g._count.members > 1)
      .map((g) => g.name);

    if (comGente.length) {
      throw new AppError(
        `Você ainda é dono de ${comGente.length === 1 ? "um servidor" : "servidores"} com outras pessoas (${comGente.join(", ")}). Passe a posse ou exclua ${comGente.length === 1 ? "ele" : "eles"} antes.`,
      );
    }

    const excluirEm = new Date(
      Date.now() + DIAS_DE_ARREPENDIMENTO * 24 * 60 * 60 * 1000,
    );

    await userRepository.update(userId, { excluirEm });
    await authService.revokeAll(userId);

    return { excluirEm: excluirEm.toISOString() };
  },

  async cancelarExclusao(userId: string) {
    await userRepository.update(userId, { excluirEm: null });
  },

  async exportar(userId: string) {
    const [usuario, membros, amizades, mensagens, quantasMensagens] =
      await Promise.all([
        userRepository.findById(userId),
        prisma.guildMember.findMany({
          where: { userId },
          select: {
            joinedAt: true,
            guild: { select: { id: true, name: true } },
          },
        }),
        prisma.friendship.findMany({
          where: {
            OR: [{ requesterId: userId }, { addresseeId: userId }],
            status: "ACCEPTED",
          },
          select: {
            createdAt: true,
            requester: { select: { id: true, username: true } },
            addressee: { select: { id: true, username: true } },
          },
        }),
        prisma.message.findMany({
          where: { authorId: userId, deletedAt: null },
          select: { id: true, channelId: true, content: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: TETO_DE_MENSAGENS,
        }),
        prisma.message.count({ where: { authorId: userId, deletedAt: null } }),
      ]);

    if (!usuario) throw new AppError("Conta não encontrada", 404);

    return {
      geradoEm: new Date().toISOString(),
      conta: {
        id: usuario.id,
        email: usuario.email,
        username: usuario.username,
        displayName: usuario.displayName,
        bio: usuario.bio,
        criadaEm: usuario.createdAt.toISOString(),
        aceitaPedidos: usuario.aceitaPedidos,
        mostraAtividade: usuario.mostraAtividade,
        mostraServidoresEmComum: usuario.mostraServidoresEmComum,
        mostraAmigosEmComum: usuario.mostraAmigosEmComum,
      },
      servidores: membros.map((m) => ({
        id: m.guild.id,
        nome: m.guild.name,
        entrouEm: m.joinedAt.toISOString(),
      })),
      amigos: amizades.map((a) => {
        const outro = a.requester.id === userId ? a.addressee : a.requester;
        return {
          id: outro.id,
          username: outro.username,
          desde: a.createdAt.toISOString(),
        };
      }),
      mensagens: {
        total: quantasMensagens,
        incluidas: mensagens.length,
        observacao:
          quantasMensagens > mensagens.length
            ? `Só as ${mensagens.length} mais recentes entraram neste arquivo.`
            : null,
        lista: mensagens.map((m) => ({
          id: m.id,
          canalId: m.channelId,
          conteudo: m.content,
          quando: m.createdAt.toISOString(),
        })),
      },
    };
  },

  async updateProfile(userId: string, input: UpdateProfileInput) {
    await respeitarVazao(userId);

    if (input.perfil?.tagGuildId) {
      await requirePodeVestirEtiqueta(userId, input.perfil.tagGuildId);
    }

    return userRepository.update(userId, {
      ...(input.aceitaPedidos !== undefined
        ? { aceitaPedidos: input.aceitaPedidos }
        : {}),
      ...(input.mostraAtividade !== undefined
        ? { mostraAtividade: input.mostraAtividade }
        : {}),
      ...(input.mostraServidoresEmComum !== undefined
        ? { mostraServidoresEmComum: input.mostraServidoresEmComum }
        : {}),
      ...(input.mostraAmigosEmComum !== undefined
        ? { mostraAmigosEmComum: input.mostraAmigosEmComum }
        : {}),
      ...(input.displayName !== undefined
        ? { displayName: input.displayName }
        : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.perfil !== undefined
        ? {
            perfil: input.perfil
              ? comConexoesLimpas(input.perfil)
              : { unset: true },
          }
        : {}),
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

function comConexoesLimpas(perfil: EstiloDePerfil): EstiloDePerfil {
  if (!perfil.conexoes) return perfil;

  return {
    ...perfil,
    conexoes: perfil.conexoes
      .map((conexao) => ({
        ...conexao,
        valor: conexao.valor.trim().replace(/^@/, ""),
      }))
      .filter((conexao) => enderecoDaConexao(conexao) !== null),
  };
}

async function requirePodeVestirEtiqueta(userId: string, guildId: string) {
  const membro = await memberRepository.find(guildId, userId);
  if (!membro) throw new AppError("Você não é membro desse servidor");

  const etiquetas = await tagRepository.resolverMuitas([guildId]);
  if (!etiquetas.has(guildId))
    throw new AppError("Esse servidor não tem etiqueta");
}

async function respeitarVazao(userId: string) {
  const chave = `me:rate:${userId}`;
  const usos = await redis.incr(chave);

  if (usos === 1) await redis.expire(chave, JANELA_S);
  if (usos > POR_JANELA)
    throw new AppError("Devagar — muitas alterações seguidas", 429);
}
