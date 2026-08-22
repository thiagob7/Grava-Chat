import { randomBytes } from "node:crypto";
import {
  computePermissions,
  DEFAULT_EVERYONE_PERMISSIONS,
  PERMISSIONS,
  has,
  type Permission,
} from "@gravae/shared";
import { AppError, NotFoundError } from "~/lib/http.js";
import {
  guildRepository,
  memberRepository,
  categoryRepository,
  channelRepository,
} from "~/repositories/guild-repository.js";
import { emblemaRepository, tagRepository } from "~/repositories/guild-repository.js";
import { inviteRepository } from "~/repositories/invite-repository.js";
import { toChannel, toMember, toPerfilPublico, toPublicUser, toRole } from "~/lib/serialize.js";
import { roleRepository, overwriteRepository } from "~/repositories/role-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { toMessage } from "~/lib/serialize.js";
import { accessService } from "./access-service.js";
import { auditService, diferenca } from "./audit-service.js";
import { presenceService } from "./presence-service.js";
import { voiceService } from "./voice-service.js";
import { messageStatsRepository } from "~/repositories/message-repository.js";
import { auditStatsRepository } from "~/repositories/audit-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import type {
  CreateChannelInput,
  CreateGuildInput,
  UpdateChannelInput,
  UpdateGuildInput,
} from "~/validations/guild.js";

const DEFAULT_CATEGORIES = ["CANAIS DE TEXTO", "CANAIS DE VOZ"];

/** Boas-vindas sorteadas, como no Discord — sempre a mesma frase cansa rápido. */
const SAUDACOES = [
  "{pessoa} acabou de chegar!",
  "Bem-vindo(a), {pessoa}. A gente estava esperando.",
  "{pessoa} entrou no servidor. Diz oi!",
  "Olha quem chegou: {pessoa}",
  "{pessoa} apareceu. Segura a emoção.",
];

export const guildService = {
  async listForUser(userId: string) {
    const memberships = await guildRepository.findManyByUser(userId);

    /**
     * A lista lateral precisa saber o que você pode fazer em cada servidor
     * (mostrar ou não "Configurações", "Criar canal"...). Calcular aqui evita
     * uma consulta de permissões por servidor no front.
     */
    const porGuild = await Promise.all(
      memberships.map(async (m) => {
        const roles = await roleRepository.findForMember(m.guildId, m.roleIds);
        const isOwner = m.guild.ownerId === userId;

        return {
          id: m.guild.id,
          name: m.guild.name,
          iconUrl: m.guild.iconUrl,
          ownerId: m.guild.ownerId,
          memberCount: m.guild._count.members,
          /** o seletor de etiqueta lista os servidores que TEM etiqueta */
          tag: m.guild.tag,
          tagIcon: m.guild.tagIcon,
          isOwner,
          permissions: [...computePermissions({ userId, isOwner, roles })],
        };
      }),
    );

    return porGuild;
  },

  /**
   * Servidor novo já nasce com categorias e canais, como no Discord: um
   * servidor vazio não tem onde clicar e passa a impressão de que quebrou.
   */
  async create(userId: string, input: CreateGuildInput) {
    const guild = await guildRepository.createWithDefaults({
      name: input.name,
      ownerId: userId,
      categories: DEFAULT_CATEGORIES,
      everyonePermissions: DEFAULT_EVERYONE_PERMISSIONS,
    });

    const [textCategory, voiceCategory] = guild.categories;

    await channelRepository.createMany([
      { guildId: guild.id, categoryId: textCategory?.id, name: "geral", type: "TEXT", position: 0 },
      { guildId: guild.id, categoryId: voiceCategory?.id, name: "Sala 1", type: "VOICE", position: 0 },
    ]);

    return {
      id: guild.id,
      name: guild.name,
      iconUrl: guild.iconUrl,
      ownerId: guild.ownerId,
      memberCount: 1,
      isOwner: true,
      permissions: [...PERMISSIONS],
    };
  },

  /**
   * O cartãozinho que abre ao clicar numa etiqueta de servidor.
   *
   * Só responde se o servidor TEM etiqueta — e essa é a fronteira de privacidade
   * inteira: um servidor com etiqueta está se anunciando por ela, que viaja ao
   * lado do nome de cada membro que a veste. Sem essa regra, isto seria uma
   * consulta livre de qualquer servidor por id, para qualquer pessoa logada.
   */
  async preview(userId: string, guildId: string) {
    const guild = await guildRepository.findByIdOrThrow(guildId);
    if (!guild.tag) throw new NotFoundError("Servidor não encontrado");

    const membros = await memberRepository.findManyByGuild(guildId);
    const presenca = await presenceService.mapFor(membros.map((m) => m.userId));

    return {
      id: guild.id,
      name: guild.name,
      iconUrl: guild.iconUrl,
      description: guild.description,
      tag: guild.tag,
      tagIcon: guild.tagIcon,
      memberCount: guild._count.members,
      onlineCount: Object.values(presenca).filter((s) => s !== "OFFLINE").length,
      createdAt: guild.createdAt.toISOString(),
      /** decide o botão: "ir para o servidor" ou nada que se possa fazer daqui */
      souMembro: membros.some((m) => m.userId === userId),
    };
  },

  /** Tudo que a tela do servidor precisa, numa chamada só. */
  async detail(userId: string, guildId: string) {
    const member = await accessService.requireMember(userId, guildId);

    const [guild, categories, todosOsCanais, members, roles, emblemas] = await Promise.all([
      guildRepository.findByIdOrThrow(guildId),
      categoryRepository.findManyByGuild(guildId),
      channelRepository.findManyByGuild(guildId),
      memberRepository.findManyByGuild(guildId),
      roleRepository.findManyByGuild(guildId),
      emblemaRepository.findManyByGuild(guildId),
    ]);

    const isOwner = guild.ownerId === userId;
    const meusCargos = roles.filter((r) => r.isEveryone || member.roleIds.includes(r.id));
    const overwrites = await overwriteRepository.findManyByChannels(todosOsCanais.map((c) => c.id));

    const porCanal = new Map<string, typeof overwrites>();
    for (const o of overwrites) porCanal.set(o.channelId, [...(porCanal.get(o.channelId) ?? []), o]);

    /**
     * As permissões são calculadas canal a canal e o que você não pode ver
     * simplesmente não sai daqui. É isso que faz um canal restrito não existir
     * para quem não tem acesso — em vez de aparecer cinza e provocar.
     */
    const permissoesPorCanal = new Map<string, Permission[]>();
    const channels = todosOsCanais.filter((c) => {
      const permissoes = computePermissions({
        userId,
        isOwner,
        roles: meusCargos,
        overwrites: porCanal.get(c.id) ?? [],
      });

      if (!has(permissoes, "VIEW_CHANNEL")) return false;
      permissoesPorCanal.set(c.id, [...permissoes]);
      return true;
    });

    /**
     * As etiquetas que os membros escolheram vestir. Podem ser de servidores
     * QUALQUER — a escolha e da pessoa e vale em todo lugar —, entao sao
     * resolvidas de uma vez, e nao uma consulta por membro.
     */
    const etiquetas = await tagRepository.resolverMuitas([
      ...new Set(
        members
          .map((m) => (m.user.perfil as { tagGuildId?: string | null } | null)?.tagGuildId)
          .filter((id): id is string => Boolean(id)),
      ),
    ]);

    const [lastMessages, presence, voiceStates] = await Promise.all([
      channelRepository.lastMessageIdByChannel(channels.map((c) => c.id)),
      // Presença e voz vêm do Redis, não do cache no Mongo — ver presence-service.
      presenceService.mapFor(members.map((m) => m.userId)),
      voiceService.statesForChannels(channels.filter((c) => c.type === "VOICE").map((c) => c.id)),
    ]);

    return {
      guild: {
        id: guild.id,
        name: guild.name,
        iconUrl: guild.iconUrl,
        description: guild.description,
        tag: guild.tag,
        tagIcon: guild.tagIcon,
        systemChannelId: guild.systemChannelId,
        welcomeEnabled: guild.welcomeEnabled,
        ownerId: guild.ownerId,
        memberCount: guild._count.members,
      },
      /** O que EU posso neste servidor — a interface se monta a partir daqui. */
      permissions: [...computePermissions({ userId, isOwner, roles: meusCargos })],
      /** E o que eu posso em cada canal, que pode ser diferente do geral. */
      channelPermissions: Object.fromEntries(permissoesPorCanal),
      roles: roles.map(toRole),
      categories: categories.map((c) => ({
        id: c.id,
        guildId: c.guildId,
        name: c.name,
        position: c.position,
      })),
      channels: channels.map((c) => ({
        ...toChannel(c),
        lastMessageId: lastMessages.get(c.id) ?? null,
      })),
      members: members.map((m) => {
        const dto = toMember(m);
        return { ...dto, user: { ...dto.user, status: presence[m.userId] ?? "OFFLINE" } };
      }),
      /**
       * Os enfeites de cada pessoa, UMA vez por pessoa.
       *
       * Não entram em `members[].user` nem em `message.author` de propósito:
       * aquele objeto está embutido em cinquenta mensagens por página, sempre
       * com o mesmo autor repetido, e um blob cosmético ali viraria dez KB por
       * página para sempre. Aqui a lista de membros já traz `user` incluído, o
       * que faz este mapa custar zero consulta.
       *
       * Quem não personalizou nada fica FORA do mapa em vez de virar `{}`: o
       * front trata ausente e vazio do mesmo jeito, e num servidor de cem
       * pessoas isso é a diferença entre pagar por todas e pagar por quem
       * escolheu alguma coisa.
       */
      profiles: Object.fromEntries(
        members
          // o emblema e do SERVIDOR: mora no membro, e so faz sentido aqui
          .map((m) => {
            const escolhida = (m.user.perfil as { tagGuildId?: string | null } | null)?.tagGuildId;
            const etiqueta = escolhida ? etiquetas.get(escolhida) : undefined;

            return [
              m.userId,
              toPerfilPublico(
                m.user,
                m.emblemIds,
                etiqueta ? { guildId: escolhida!, ...etiqueta } : null,
              ),
            ] as const;
          })
          .filter(([, perfil]) => Object.keys(perfil).length > 0),
      ),
      /** As definicoes; quem veste o que esta no mapa `profiles`. */
      emblemas: emblemas.map((e) => ({
        id: e.id,
        guildId: e.guildId,
        nome: e.nome,
        emoji: e.emoji,
        iconUrl: e.iconUrl,
      })),
      voiceStates,
    };
  },

  /** Editar o servidor: perfil, etiqueta e mensagens do sistema. */
  async update(userId: string, guildId: string, input: UpdateGuildInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    const antes = await guildRepository.findByIdOrThrow(guildId);
    const guild = await guildRepository.update(guildId, input);

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "guild.update",
      targetType: "guild",
      targetId: guildId,
      targetName: guild.name,
      changes: diferenca(antes as unknown as Record<string, unknown>, input),
    });

    return {
      id: guild.id,
      name: guild.name,
      iconUrl: guild.iconUrl,
      description: guild.description,
      tag: guild.tag,
      tagIcon: guild.tagIcon,
      systemChannelId: guild.systemChannelId,
      welcomeEnabled: guild.welcomeEnabled,
      ownerId: guild.ownerId,
      memberCount: guild._count.members,
    };
  },

  /**
   * Mensagem de boas-vindas. É uma mensagem de sistema no canal escolhido —
   * o que faz o servidor parecer vivo quando chega gente nova.
   */
  async boasVindas(guildId: string, userId: string) {
    const guild = await guildRepository.findById(guildId);
    if (!guild?.welcomeEnabled || !guild.systemChannelId) return null;

    const frase = SAUDACOES[Math.floor(Math.random() * SAUDACOES.length)]!;

    const criada = await messageRepository.create({
      channelId: guild.systemChannelId,
      authorId: userId,
      tipo: "JOIN",
      content: frase.replace("{pessoa}", `<@${userId}>`),
      attachments: [],
      replyToId: null,
      mentions: [userId],
    });

    return toMessage(criada, userId);
  },

  /** Convites ativos do servidor, com quem criou e quanto já foi usado. */
  async listInvites(userId: string, guildId: string) {
    await accessService.requirePermission(userId, guildId, "CREATE_INVITE");
    const convites = await inviteRepository.findManyByGuild(guildId);

    return convites.map((c) => ({
      id: c.id,
      code: c.code,
      inviter: toPublicUser(c.inviter),
      uses: c.uses,
      maxUses: c.maxUses,
      expiresAt: c.expiresAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      // já vencido ou esgotado continua na lista, mas marcado
      expired: Boolean(
        (c.expiresAt && c.expiresAt < new Date()) || (c.maxUses !== null && c.uses >= c.maxUses),
      ),
    }));
  },

  async removeInvite(userId: string, guildId: string, inviteId: string) {
    await accessService.requirePermission(userId, guildId, "CREATE_INVITE");

    const convite = await inviteRepository.findById(inviteId);
    if (!convite || convite.guildId !== guildId) throw new NotFoundError("Convite não encontrado");

    // quem criou pode revogar o seu; para revogar de outros, precisa gerenciar o servidor
    if (convite.inviterId !== userId) {
      await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");
    }

    await inviteRepository.remove(inviteId);
  },

  async createChannel(userId: string, guildId: string, input: CreateChannelInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_CHANNELS");


    const categoryId = input.categoryId ?? null;
    const last = await channelRepository.lastPosition(guildId, categoryId);

    const channel = await channelRepository.create({
      guildId,
      categoryId,
      name: input.name,
      type: input.type,
      topic: input.topic ?? null,
      isPrivate: input.isPrivate ?? false,
      position: (last?.position ?? -1) + 1,
    });

    /**
     * Canal privado já nasce fechado: nega VIEW_CHANNEL para o @everyone e
     * devolve o acesso a quem criou. Criar e só depois configurar deixaria uma
     * janela em que o canal "privado" esteve aberto para o servidor inteiro.
     */
    if (channel.isPrivate) {
      const everyone = await roleRepository.findEveryone(guildId);

      if (everyone) {
        await overwriteRepository.upsert({
          channelId: channel.id,
          targetId: everyone.id,
          type: "ROLE",
          allow: [],
          deny: ["VIEW_CHANNEL"],
        });
      }

      await overwriteRepository.upsert({
        channelId: channel.id,
        targetId: userId,
        type: "MEMBER",
        allow: ["VIEW_CHANNEL"],
        deny: [],
      });
    }

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "channel.create",
      targetType: "channel",
      targetId: channel.id,
      targetName: channel.name,
    });

    return toChannel(channel);
  },

  async updateChannel(userId: string, guildId: string, channelId: string, input: UpdateChannelInput) {
    await accessService.requirePermission(userId, guildId, "MANAGE_CHANNELS", channelId);

    const antes = await channelRepository.findById(channelId);
    if (!antes || antes.guildId !== guildId) throw new NotFoundError("Canal não encontrado");

    const channel = await channelRepository.update(channelId, input);

    auditService.registrar({
      guildId,
      actorId: userId,
      action: "channel.update",
      targetType: "channel",
      targetId: channelId,
      targetName: channel.name,
      changes: diferenca(antes as unknown as Record<string, unknown>, input),
    });

    return toChannel(channel);
  },

  async deleteChannel(userId: string, guildId: string, channelId: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_CHANNELS", channelId);

    const channel = await channelRepository.findById(channelId);
    if (!channel || channel.guildId !== guildId) throw new NotFoundError("Canal não encontrado");

    await channelRepository.remove(channelId);
    auditService.registrar({
      guildId,
      actorId: userId,
      action: "channel.delete",
      targetType: "channel",
      targetId: channelId,
      targetName: channel.name,
    });
  },

  async createCategory(userId: string, guildId: string, name: string) {
    await accessService.requirePermission(userId, guildId, "MANAGE_CHANNELS");

    const last = await categoryRepository.lastPosition(guildId);
    return categoryRepository.create({ guildId, name, position: (last?.position ?? -1) + 1 });
  },

  async createInvite(
    userId: string,
    guildId: string,
    input: { maxUses?: number | null; expiresInHours?: number | null },
  ) {
    await accessService.requirePermission(userId, guildId, "CREATE_INVITE");

    const invite = await inviteRepository.create({
      code: randomBytes(6).toString("base64url"),
      guildId,
      inviterId: userId,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresInHours ? new Date(Date.now() + input.expiresInHours * 3600_000) : null,
    });

    return { code: invite.code, expiresAt: invite.expiresAt, maxUses: invite.maxUses };
  },

  /**
   * Apagar o servidor. Só o dono — nem ADMIN pode, porque é irreversível e leva
   * junto todo o histórico de conversa de todo mundo que está lá.
   */
  async remove(userId: string, guildId: string) {
    const guild = await guildRepository.findById(guildId);
    if (!guild) throw new NotFoundError("Servidor não encontrado");
    if (guild.ownerId !== userId) throw new AppError("Só o dono pode apagar o servidor", 403);

    const membros = await memberRepository.findManyByGuild(guildId);
    await guildRepository.remove(guildId);

    return membros.map((m) => m.userId);
  },

  /** Sair do próprio servidor não exige permissão; expulsar outro exige. */
  /**
   * A ficha de um membro para quem modera: o que ele mandou, o que pode fazer e
   * desde quando está aqui.
   *
   * Exige `MODERATE_MEMBERS` — é informação sobre outra pessoa, e quem não
   * modera não tem por que ver a contagem de mensagens de ninguém.
   */
  async moderationView(actorId: string, guildId: string, targetId: string) {
    await accessService.requirePermission(actorId, guildId, "MODERATE_MEMBERS");

    const membro = await memberRepository.find(guildId, targetId);
    if (!membro) throw new NotFoundError("Essa pessoa não está no servidor");

    const canais = await channelRepository.findManyByGuild(guildId);
    const contexto = await accessService.contextOf(targetId, guildId);

    const usuario = await userRepository.findByIdOrThrow(targetId);

    const [atividade, auditoria] = await Promise.all([
      messageStatsRepository.byUserInChannels(targetId, canais.map((c) => c.id)),
      auditStatsRepository.countFor(guildId, targetId),
    ]);

    // quem convidou pode ter saído do servidor desde então; o nome é opcional
    const convidadoPor = membro.invitedById
      ? await userRepository.findById(membro.invitedById)
      : null;

    return {
      atividade,
      auditoria,
      // `computePermissions` devolve Set, e Set vira `{}` no JSON — o resto do
      // service já espalha em array por isso mesmo
      permissoes: [...contexto.permissions],
      roleIds: membro.roleIds,
      entrouNoServidor: membro.joinedAt,
      entrouNoGravae: usuario.createdAt,
      timeoutUntil: membro.timeoutUntil,
      adesao: {
        inviteCode: membro.inviteCode,
        convidadoPor: convidadoPor ? convidadoPor.displayName : null,
      },
    };
  },

  /**
   * As mensagens de um membro, para o "ver mais" de cada contagem.
   *
   * Mesma permissão da ficha: quem não modera não lê o histórico de ninguém.
   */
  async moderationMessages(
    actorId: string,
    guildId: string,
    targetId: string,
    filtro: "todas" | "links" | "midia",
    before?: string,
  ) {
    await accessService.requirePermission(actorId, guildId, "MODERATE_MEMBERS");

    const canais = await channelRepository.findManyByGuild(guildId);
    const linhas = await messageStatsRepository.findByUserInChannels({
      userId: targetId,
      channelIds: canais.map((c) => c.id),
      filtro,
      limit: 50,
      before,
    });

    return linhas.map((m) => ({
      id: m.id,
      channelId: m.channelId,
      channelName: m.channel.name,
      channelType: m.channel.type,
      content: m.content,
      attachments: m.attachments,
      createdAt: m.createdAt,
    }));
  },

  async removeMember(actorId: string, guildId: string, targetId: string) {
    if (targetId !== actorId) await accessService.requirePermission(actorId, guildId, "KICK_MEMBERS");
    else await accessService.requireMember(actorId, guildId);

    const guild = await guildRepository.findById(guildId);
    if (!guild) throw new NotFoundError("Servidor não encontrado");
    if (guild.ownerId === targetId) throw new AppError("O dono não pode sair do próprio servidor");

    await memberRepository.remove(guildId, targetId);
  },
};
