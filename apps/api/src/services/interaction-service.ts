import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  fieldLimits,
  INTERACTION_RESPONSE_MS,
  selectLimits,
  type InteractInput,
  type ModalInput,
  type ModalSubmitInput,
  type ServerToClientEvents,
} from "@gravae/shared";

import { findComponent, findInRows } from "~/lib/components.js";
import { ephemeralService } from "./ephemeral-service.js";
import { AppError, NotFoundError } from "~/lib/http.js";
import { keys, redis } from "~/lib/redis.js";
import { toPublicUser } from "~/lib/serialize.js";
import { memberRepository } from "~/repositories/guild-repository.js";
import { messageRepository } from "~/repositories/message-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "./access-service.js";

const INTERACTION_TTL_S = 15 * 60;
const RESPONSE_GRACE_MS = 500;

export type InteractionKind = "component" | "command" | "modal";

export interface StoredInteraction {
  id: string;
  kind: InteractionKind;
  updatable: boolean;
  sourceEphemeral: boolean;
  tokenHash: string;
  botUserId: string;
  userId: string;
  guildId: string | null;
  channelId: string;
  messageId: string;
  customId: string;
  createdAt: number;
}

export interface StoredModal {
  id: string;
  userId: string;
  botUserId: string;
  guildId: string | null;
  channelId: string;
  messageId: string;
  updatable: boolean;
  sourceEphemeral: boolean;
  modal: ModalInput;
}

type InteractionEvent = Parameters<ServerToClientEvents["interaction:created"]>[0];

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

const sameHash = (expected: string, given: string) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
};

async function findSource(userId: string, messageId: string) {
  const message = await messageRepository.findById(messageId);

  if (message && !message.deletedAt) {
    return {
      channelId: message.channelId,
      authorId: message.authorId,
      ephemeral: false,
      find: (customId: string) => findComponent(message.components, customId),
    };
  }

  const ephemeral = await ephemeralService.find(messageId);

  if (ephemeral && ephemeral.userId === userId) {
    return {
      channelId: ephemeral.message.channelId,
      authorId: ephemeral.botUserId,
      ephemeral: true,
      find: (customId: string) => findInRows(ephemeral.message.components ?? [], customId),
    };
  }

  throw new NotFoundError("Mensagem não encontrada");
}

const notFound = () => new NotFoundError("Interaction not found or expired");

export const interactionService = {
  open(params: Omit<StoredInteraction, "id" | "tokenHash" | "createdAt">) {
    const token = randomBytes(32).toString("base64url");

    const interaction: StoredInteraction = {
      ...params,
      id: randomUUID(),
      tokenHash: hashToken(token),
      createdAt: Date.now(),
    };

    return { interaction, token };
  },

  async prepare(userId: string, input: InteractInput) {
    const source = await findSource(userId, input.messageId);

    const { channel } = await accessService.requireChannelAccess(userId, source.channelId);

    const author = await userRepository.findById(source.authorId);
    const component = author?.isBot ? source.find(input.customId) : undefined;
    if (!author || !component) throw new NotFoundError("Essa opção não existe mais");

    if (component.disabled) throw new AppError("Essa opção está desativada");

    const values = input.values ?? [];

    if (component.type === "button" && values.length) throw new AppError("Botão não recebe valores");

    if (component.type === "select") {
      const allowed = new Set(component.options.map((option) => option.value));
      const { min, max } = selectLimits(component);

      if (new Set(values).size !== values.length || values.some((value) => !allowed.has(value))) {
        throw new AppError("Opção inválida");
      }
      if (values.length < min || values.length > max) {
        throw new AppError(min === max ? `Escolha ${min} opção(ões)` : `Escolha de ${min} a ${max} opções`);
      }
    }

    const [user, member] = await Promise.all([
      userRepository.findById(userId),
      channel.guildId ? memberRepository.find(channel.guildId, userId) : Promise.resolve(null),
    ]);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const { interaction, token } = interactionService.open({
      kind: "component",
      updatable: true,
      sourceEphemeral: source.ephemeral,
      botUserId: author.id,
      userId,
      guildId: channel.guildId,
      channelId: channel.id,
      messageId: input.messageId,
      customId: input.customId,
    });

    const event: InteractionEvent = {
      id: interaction.id,
      token,
      type: "component",
      guildId: channel.guildId,
      channelId: channel.id,
      messageId: input.messageId,
      customId: input.customId,
      values,
      fields: {},
      user: toPublicUser(user),
      member: member ? { roleIds: member.roleIds, nickname: member.nickname } : null,
    };

    return { interaction, event };
  },

  async store(interaction: StoredInteraction) {
    await redis.set(keys.interaction(interaction.id), JSON.stringify(interaction), "EX", INTERACTION_TTL_S);
  },

  async claim(botUserId: string, interactionId: string, token: string) {
    const raw = await redis.get(keys.interaction(interactionId));
    const interaction = raw ? (JSON.parse(raw) as StoredInteraction) : null;

    if (!interaction || interaction.botUserId !== botUserId || !sameHash(interaction.tokenHash, hashToken(token))) {
      throw notFound();
    }

    if (Date.now() - interaction.createdAt > INTERACTION_RESPONSE_MS + RESPONSE_GRACE_MS) {
      throw new AppError(`Respond within ${INTERACTION_RESPONSE_MS / 1000} seconds, or send a defer first`, 410);
    }

    const first = await redis.set(keys.interactionAnswered(interactionId), "1", "EX", INTERACTION_TTL_S, "NX");
    if (first !== "OK") throw new AppError("This interaction was already answered", 409);

    return interaction;
  },

  async openModal(interaction: StoredInteraction, modal: ModalInput) {
    if (interaction.kind === "modal") throw new AppError("A modal submission cannot open another modal", 400);

    const stored: StoredModal = {
      id: randomUUID(),
      userId: interaction.userId,
      botUserId: interaction.botUserId,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      messageId: interaction.messageId,
      updatable: interaction.updatable,
      sourceEphemeral: interaction.sourceEphemeral,
      modal,
    };

    await redis.set(keys.modal(stored.id), JSON.stringify(stored), "EX", INTERACTION_TTL_S);

    return stored;
  },

  async prepareModalSubmit(userId: string, input: ModalSubmitInput) {
    const raw = await redis.get(keys.modal(input.modalId));
    const stored = raw ? (JSON.parse(raw) as StoredModal) : null;
    if (!stored || stored.userId !== userId) throw new NotFoundError("Esse formulário expirou");

    const specs = new Map(stored.modal.fields.map((field) => [field.customId, field]));

    if (Object.keys(input.fields).some((id) => !specs.has(id))) throw new AppError("Campo desconhecido no formulário");

    const fields: Record<string, string> = {};

    for (const field of stored.modal.fields) {
      const value = input.fields[field.customId] ?? "";
      const { min, max, required } = fieldLimits(field);

      if (!value.trim()) {
        if (required) throw new AppError(`Preencha "${field.label}"`);
        fields[field.customId] = "";
        continue;
      }

      if (value.length < min || value.length > max) {
        throw new AppError(`"${field.label}" precisa ter de ${min} a ${max} caracteres`);
      }

      fields[field.customId] = value;
    }

    const { channel } = await accessService.requireChannelAccess(userId, stored.channelId);

    const [user, member] = await Promise.all([
      userRepository.findById(userId),
      channel.guildId ? memberRepository.find(channel.guildId, userId) : Promise.resolve(null),
    ]);
    if (!user) throw new NotFoundError("Usuário não encontrado");

    const { interaction, token } = interactionService.open({
      kind: "modal",
      updatable: stored.updatable,
      sourceEphemeral: stored.sourceEphemeral,
      botUserId: stored.botUserId,
      userId,
      guildId: channel.guildId,
      channelId: channel.id,
      messageId: stored.messageId,
      customId: stored.modal.customId,
    });

    const event: InteractionEvent = {
      id: interaction.id,
      token,
      type: "modal",
      guildId: channel.guildId,
      channelId: channel.id,
      messageId: stored.messageId,
      customId: stored.modal.customId,
      values: [],
      fields,
      user: toPublicUser(user),
      member: member ? { roleIds: member.roleIds, nickname: member.nickname } : null,
    };

    return { interaction, event };
  },

  async consumeModal(modalId: string) {
    return (await redis.del(keys.modal(modalId))) === 1;
  },

  async release(interactionId: string) {
    await redis.del(keys.interactionAnswered(interactionId)).catch(() => undefined);
  },
};
