import { randomBytes } from "node:crypto";

import {
  PERMISSIONS,
  CATEGORIES_LIMIT,
  LANGUAGES_LIMIT,
  botCommandSchema,
  type AppDiscovered,
  type AppPublic,
  type BotCommand,
  type Permission,
} from "@gravae/shared";
import { AppError, ForbiddenError, NotFoundError } from "~/lib/http.js";
import { toPublicUser } from "~/lib/serialize.js";
import { botRepository } from "~/repositories/bot-repository.js";
import { memberRepository, guildRepository } from "~/repositories/guild-repository.js";
import { roleRepository } from "~/repositories/role-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { authService } from "~/services/auth-service.js";

const LIMIT_BY_PERSON = 10;

const DEFAULT_REQUEST: Permission[] = [
  "VIEW_CHANNEL",
  "SEND_MESSAGES",
  "READ_MESSAGE_HISTORY",
  "ADD_REACTIONS",
  "ATTACH_FILES",
];

const newToken = () => randomBytes(32).toString("base64url");

type BotWithUser = NonNullable<Awaited<ReturnType<typeof botRepository.findById>>>;

const forOwner = (bot: BotWithUser, token?: string) => ({
  id: bot.id,
  user: toPublicUser(bot.user),
  description: bot.description,
  coverUrl: bot.coverUrl,
  categories: bot.categories,
  languages: bot.languages,
  termsUrl: bot.termsUrl,
  policyUrl: bot.policyUrl,
  supportServerId: bot.supportServerId,
  permissionsRequested: bot.permissionsRequested as Permission[],
  isPublic: bot.isPublic,
  redirectUris: bot.redirectUris,
  clientSecret: bot.clientSecret,
  createdAt: bot.createdAt.toISOString(),
  ...(token ? { token } : {}),
});

const forInvite = (bot: BotWithUser) => ({
  id: bot.id,
  user: toPublicUser(bot.user),
  description: bot.description,
  permissionsRequested: bot.permissionsRequested as Permission[],
  isPublic: bot.isPublic,
});

export const botService = {
  async list(ownerId: string) {
    return (await botRepository.findManyOf(ownerId)).map((b) => forOwner(b));
  },

  async isPublic(search?: string, category?: string): Promise<AppDiscovered[]> {
    const bots = await botRepository.findPublic(search?.trim() || undefined, category);

    return bots.map((bot) => ({
      id: bot.id,
      name: bot.user.displayName,
      avatarUrl: bot.user.avatarUrl,
      coverUrl: bot.coverUrl,
      categories: bot.categories,
      description: bot.description,
      permissionsRequested: bot.permissionsRequested,
      commands: Array.isArray(bot.commands) ? bot.commands.length : 0,
      owner: bot.owner,
      createdAt: bot.createdAt.toISOString(),
    }));
  },

  async publicApp(userId: string, botId: string): Promise<AppPublic> {
    const bot = await botRepository.findPublicById(botId);
    if (!bot) throw new NotFoundError("Aplicativo não encontrado");

    const commands = (Array.isArray(bot.commands) ? bot.commands : []) as BotCommand[];
    const mine = (await memberRepository.guildIdsOf(userId)).map((m) => m.guildId);
    const dele = new Set((await memberRepository.guildIdsOf(bot.botUserId)).map((m) => m.guildId));
    const inCommon = mine.filter((id) => dele.has(id));

    const support = bot.supportServerId
      ? await guildRepository.findByIdOrThrow(bot.supportServerId).catch(() => null)
      : null;

    return {
      id: bot.id,
      name: bot.user.displayName,
      username: bot.user.username,
      userId: bot.user.id,
      avatarUrl: bot.user.avatarUrl,
      coverUrl: bot.coverUrl,
      categories: bot.categories,
      languages: bot.languages,
      termsUrl: bot.termsUrl,
      policyUrl: bot.policyUrl,
      supportServer: support
        ? {
            id: support.id,
            name: support.name,
            iconUrl: support.iconUrl,
            members: support._count.members,
          }
        : null,
      servers: dele.size,
      description: bot.description,
      permissionsRequested: bot.permissionsRequested,
      commands: commands.length,
      listCommands: commands.map((command) => ({
        name: command.name,
        description: command.description,
      })),
      serversCommon: inCommon.length,
      owner: bot.owner,
      createdAt: bot.createdAt.toISOString(),
    };
  },

  async create(ownerId: string, name: string) {
    const mine = await botRepository.findManyOf(ownerId);
    if (mine.length >= LIMIT_BY_PERSON) {
      throw new AppError(`Você já tem ${LIMIT_BY_PERSON} bots.`, 400);
    }

    const user = await userRepository.create({
      email: `bot-${randomBytes(8).toString("hex")}@bots.gravae.local`,
      username: await authService.uniqueUsername(name),
      displayName: name,
      isBot: true,
    });

    const token = newToken();
    const bot = await botRepository.create({
      ownerId,
      botUserId: user.id,
      token,
      clientSecret: randomBytes(32).toString("base64url"),
      permissionsRequested: DEFAULT_REQUEST,
    });

    return forOwner(bot, token);
  },

  async edit(
    ownerId: string,
    botId: string,
    data: {
      name?: string;
      description?: string | null;
      avatarUrl?: string | null;
      coverUrl?: string | null;
      categories?: string[];
      languages?: string[];
      termsUrl?: string | null;
      policyUrl?: string | null;
      supportServerId?: string | null;
      permissionsRequested?: string[];
      isPublic?: boolean;
      redirectUris?: string[];
    },
  ) {
    const bot = await botService.myBot(ownerId, botId);

    if (data.name !== undefined || data.avatarUrl !== undefined) {
      await userRepository.update(bot.botUserId, {
        ...(data.name !== undefined ? { displayName: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      });
    }

    const requested = data.permissionsRequested?.filter((p): p is Permission =>
      (PERMISSIONS as readonly string[]).includes(p),
    );

    const updated = await botRepository.update(botId, {
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.coverUrl !== undefined ? { coverUrl: data.coverUrl } : {}),
      ...(data.categories ? { categories: data.categories.slice(0, CATEGORIES_LIMIT) } : {}),
      ...(data.languages ? { languages: data.languages.slice(0, LANGUAGES_LIMIT) } : {}),
      ...(data.termsUrl !== undefined ? { termsUrl: data.termsUrl } : {}),
      ...(data.policyUrl !== undefined ? { policyUrl: data.policyUrl } : {}),
      ...(data.supportServerId !== undefined
        ? { supportServerId: data.supportServerId }
        : {}),
      ...(requested ? { permissionsRequested: requested } : {}),
      ...(data.isPublic !== undefined ? { isPublic: data.isPublic } : {}),
      ...(data.redirectUris ? { redirectUris: data.redirectUris.slice(0, 10) } : {}),
    });

    return forOwner(updated);
  },

  async regenerateToken(ownerId: string, botId: string) {
    await botService.myBot(ownerId, botId);

    const token = newToken();
    const bot = await botRepository.updateToken(botId, token);

    return forOwner(bot, token);
  },

  async doDelete(ownerId: string, botId: string) {
    const bot = await botService.myBot(ownerId, botId);

    await botRepository.delete(bot.id);
    await userRepository.remove(bot.botUserId);
  },

  async forInvite(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    return forInvite(bot);
  },

  async thisAt(botId: string, guildId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    return Boolean(await memberRepository.find(guildId, bot.botUserId));
  },

  async addServer(userId: string, botId: string, guildId: string, picked?: string[]) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const permissions = picked
      ? bot.permissionsRequested.filter((p) => picked.includes(p))
      : bot.permissionsRequested;

    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");

    if (!bot.isPublic && bot.ownerId !== userId) {
      throw new ForbiddenError("Esse bot é fechado: só quem o criou pode adicioná-lo.");
    }

    const alreadyThis = await memberRepository.find(guildId, bot.botUserId);
    if (alreadyThis) throw new AppError("Esse bot já está nesse servidor.", 400);

    const role = permissions.length
      ? await roleRepository.create({
          guildId,
          name: (bot.user.displayName || "Bot").slice(0, 32),
          permissions: permissions,
          position: 1,
        })
      : null;

    await memberRepository.create({
      guildId,
      userId: bot.botUserId,
      roleIds: role ? [role.id] : [],
    });

    return { guildId, botId, roleId: role?.id ?? null };
  },

  async removeServer(userId: string, botId: string, guildId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    await accessService.requirePermission(userId, guildId, "MANAGE_GUILD");
    await memberRepository.remove(guildId, bot.botUserId);
  },

  async destinationsFor(userId: string, botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const [mine, whereBotThis] = await Promise.all([
      memberRepository.guildIdsOf(userId),
      memberRepository.guildIdsOf(bot.botUserId),
    ]);

    const alreadyHas = new Set(whereBotThis.map((m) => m.guildId));

    const candidates = await Promise.all(
      mine
        .filter((m) => !alreadyHas.has(m.guildId))
        .map(async (m) => {
          const can = await accessService
            .requirePermission(userId, m.guildId, "MANAGE_GUILD")
            .then(() => true)
            .catch(() => false);

          if (!can) return null;

          const guild = await guildRepository.findById(m.guildId);
          return guild ? { id: guild.id, name: guild.name, iconUrl: guild.iconUrl } : null;
        }),
    );

    return {
      destinations: candidates.filter((g) => g !== null),
      serversTotal: mine.length,
      alreadyThisAt: alreadyHas.size,
    };
  },

  async servers(botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const members = await memberRepository.guildIdsOf(bot.botUserId);
    const guilds = await Promise.all(members.map((m) => guildRepository.findById(m.guildId)));

    return guilds
      .filter((g) => g !== null)
      .map((g) => ({ id: g.id, name: g.name, iconUrl: g.iconUrl }));
  },

  commands(bot: { commands: unknown }): BotCommand[] {
    if (!Array.isArray(bot.commands)) return [];

    return bot.commands.flatMap((raw) => {
      const read = botCommandSchema.safeParse(raw);
      return read.success ? [read.data] : [];
    });
  },

  async setCommands(botId: string, commands: BotCommand[]) {
    const names = new Set<string>();

    for (const command of commands) {
      if (names.has(command.name)) {
        throw new AppError(`Dois comandos com o mesmo nome: /${command.name}`, 400);
      }
      names.add(command.name);

      const options = new Set<string>();
      for (const option of command.options) {
        if (options.has(option.name)) {
          throw new AppError(`/${command.name} tem duas opções "${option.name}"`, 400);
        }
        options.add(option.name);
      }

      const optionalFirst = command.options.findIndex((o) => !o.required);
      if (
        optionalFirst >= 0 &&
        command.options.slice(optionalFirst).some((o) => o.required)
      ) {
        throw new AppError(
          `Em /${command.name}, opção obrigatória depois de opcional: não dá para saber qual valor é de qual.`,
          400,
        );
      }
    }

    const bot = await botRepository.update(botId, { commands });
    return botService.commands(bot);
  },

  async serverCommands(guildId: string) {
    const members = await memberRepository.findManyByGuild(guildId);
    const idsDeBot = members.filter((m) => m.user.isBot).map((m) => m.userId);

    if (!idsDeBot.length) return [];

    const bots = await botRepository.findManyByUserIds(idsDeBot);

    return bots.flatMap((bot) =>
      botService.commands(bot).map((command) => ({
        ...command,
        botId: bot.id,
        bot: toPublicUser(bot.user),
      })),
    );
  },

  async resolveInvocation(params: {
    guildId: string;
    botId: string;
    command: string;
    options: Record<string, string>;
  }) {
    const bot = await botRepository.findById(params.botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");

    const member = await memberRepository.find(params.guildId, bot.botUserId);
    if (!member) throw new NotFoundError("Esse bot não está neste servidor");

    const command = botService.commands(bot).find((c) => c.name === params.command);
    if (!command) throw new NotFoundError(`/${params.command} não existe`);

    const declared = new Set(command.options.map((o) => o.name));
    for (const name of Object.keys(params.options)) {
      if (!declared.has(name)) throw new AppError(`/${command.name} não tem "${name}"`, 400);
    }

    const values: Record<string, string | number> = {};

    for (const option of command.options) {
      const raw = params.options[option.name]?.trim() ?? "";

      if (!raw) {
        if (option.required) throw new AppError(`Falta "${option.name}" em /${command.name}`, 400);
        continue;
      }

      values[option.name] = convert(option, raw, command.name);
    }

    return { bot, command, options: values };
  },

  async resolveToken(token: string) {
    const bot = await botRepository.findByToken(token);
    if (!bot) return null;

    return { botId: bot.id, userId: bot.botUserId };
  },

  async myBot(ownerId: string, botId: string) {
    const bot = await botRepository.findById(botId);
    if (!bot) throw new NotFoundError("Bot não encontrado");
    if (bot.ownerId !== ownerId) throw new ForbiddenError("Esse bot não é seu");

    return bot;
  },
};

const soId = (value: string) => /^<[@#]&?([a-f\d]{24})>$/i.exec(value)?.[1] ?? value;

function convert(
  option: { name: string; kind: string },
  raw: string,
  command: string,
): string | number {
  if (option.kind === "numero") {
    const number = Number(raw.replace(",", "."));
    if (!Number.isFinite(number)) {
      throw new AppError(`"${option.name}" em /${command} precisa ser um número`, 400);
    }
    return number;
  }

  if (option.kind === "usuario" || option.kind === "canal") {
    const id = soId(raw);
    if (!/^[a-f\d]{24}$/i.test(id)) {
      const oQue = option.kind === "usuario" ? "uma pessoa" : "um canal";
      throw new AppError(`"${option.name}" em /${command} precisa ser ${oQue}`, 400);
    }
    return id;
  }

  return raw;
}
