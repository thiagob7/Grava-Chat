import { z } from "zod";
import { CHANNEL_TYPES, DESIRED_STATUSES, PRESENCE_STATUSES, LIMITS } from "./constants.js";
import {
  corHex,
  ESTILOS_DE_CARGO,
  estiloDePerfilSchema,
  FONTES_DE_NOME,
  statusPersonalizadoSchema,
} from "./cosmeticos.js";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "id invalido");

export const publicUserSchema = z.object({
  id: objectId,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  status: z.enum(PRESENCE_STATUSES),
  /// Conta de bot ou de webhook. Sai daqui porque um bot precisa saber quem é
  /// bot para não responder a outro — dois bots num canal, sem isto, ficam
  /// conversando entre si até alguém desligar.
  isBot: z.boolean(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const selfUserSchema = publicUserSchema.extend({
  email: z.email(),
  bio: z.string().nullable(),
  providers: z.array(z.string()),
  createdAt: z.iso.datetime(),
  perfil: estiloDePerfilSchema.nullable(),
  statusPersonalizado: statusPersonalizadoSchema.nullable(),
  desiredStatus: z.enum(DESIRED_STATUSES),
});
export type SelfUser = z.infer<typeof selfUserSchema>;

export const guildSchema = z.object({
  id: objectId,
  name: z.string(),
  iconUrl: z.string().nullable(),
  ownerId: objectId,
  memberCount: z.number().int(),
});
export type Guild = z.infer<typeof guildSchema>;

export const categorySchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  position: z.number().int(),
});
export type Category = z.infer<typeof categorySchema>;

export const channelSchema = z.object({
  id: objectId,
  guildId: objectId.nullable(),
  categoryId: objectId.nullable(),
  name: z.string(),
  fonte: z.enum(FONTES_DE_NOME).nullable().optional(),
  type: z.enum(CHANNEL_TYPES),
  topic: z.string().nullable(),
  position: z.number().int(),
  isPrivate: z.boolean(),
  slowmodeSeconds: z.number().int(),
  contentVisibility: z.enum(["DEFAULT", "SPOILER", "AGE_RESTRICTED"]),
  bitrate: z.number().int(),
  videoQuality: z.enum(["AUTO", "HD"]),
  userLimit: z.number().int(),
});
export type Channel = z.infer<typeof channelSchema>;

export const attachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  spoiler: z.boolean().optional(),
  description: z.string().max(1024).nullable().optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const pollOptionSchema = z.object({
  id: z.string(),
  texto: z.string().max(80),
  emoji: z.string().nullable().optional(),
  userIds: z.array(objectId),
});

export const pollSchema = z.object({
  pergunta: z.string().max(200),
  opcoes: z.array(pollOptionSchema).min(2).max(5),
  multiSelect: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
});
export type Poll = z.infer<typeof pollSchema>;

export const stickerSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  description: z.string().nullable(),
  relatedEmoji: z.string(),
  url: z.string(),
});
export type Sticker = z.infer<typeof stickerSchema>;

export const guildEmojiSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  url: z.string(),
  animated: z.boolean(),
});
export type GuildEmoji = z.infer<typeof guildEmojiSchema>;

export const guildSoundSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  emoji: z.string().nullable(),
  url: z.string(),
  volume: z.number(),
});
export type GuildSound = z.infer<typeof guildSoundSchema>;

export const reactionSummarySchema = z.object({
  emoji: z.string(),
  count: z.number().int(),
  me: z.boolean(),
  /// alguém super-reagiu com este emoji — a pílula ganha o brilho
  burst: z.boolean(),
});
export type ReactionSummary = z.infer<typeof reactionSummarySchema>;

export const reactionStateSchema = z.object({
  emoji: z.string(),
  userIds: z.array(objectId),
  burst: z.boolean(),
});
export type ReactionState = z.infer<typeof reactionStateSchema>;

export const messageSchema = z.object({
  id: objectId,
  channelId: objectId,
  author: publicUserSchema,
  content: z.string(),
  fonte: z.enum(FONTES_DE_NOME).nullable().optional(),
  tipo: z.enum(["USER", "JOIN", "COMANDO"]),
  attachments: z.array(attachmentSchema),
  poll: pollSchema.nullable(),
  sticker: stickerSchema.nullable(),
  reactions: z.array(reactionSummarySchema),
  mentions: z.array(objectId),
  mentionRoleIds: z.array(objectId),
  mentionEveryone: z.boolean(),
  replyToId: objectId.nullable(),
  postId: objectId.nullable(),
  pinnedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  editedAt: z.iso.datetime().nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const guildMemberSchema = z.object({
  id: objectId,
  guildId: objectId,
  user: publicUserSchema,
  roleIds: z.array(objectId),
  nickname: z.string().nullable(),
  timeoutUntil: z.iso.datetime().nullable(),
  joinedAt: z.iso.datetime(),
});

export const roleSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  color: z.string().nullable(),
  colorSecondary: z.string().nullable(),
  iconUrl: z.string().nullable(),
  iconEmoji: z.string().nullable(),
  estilo: z.enum(ESTILOS_DE_CARGO),
  position: z.number().int(),
  permissions: z.array(z.string()),
  hoist: z.boolean(),
  mentionable: z.boolean(),
  isEveryone: z.boolean(),
});
export type Role = z.infer<typeof roleSchema>;

export const emblemaSchema = z.object({
  id: objectId,
  guildId: objectId,
  nome: z.string(),
  emoji: z.string().nullable(),
  iconUrl: z.string().nullable(),
});
export type Emblema = z.infer<typeof emblemaSchema>;

export const overwriteSchema = z.object({
  channelId: objectId,
  targetId: objectId,
  type: z.enum(["ROLE", "MEMBER"]),
  allow: z.array(z.string()),
  deny: z.array(z.string()),
});
export type Overwrite = z.infer<typeof overwriteSchema>;
export type GuildMember = z.infer<typeof guildMemberSchema>;

export const voiceStateSchema = z.object({
  userId: objectId,
  channelId: objectId,
  guildId: objectId,
  socketId: z.string(),
  orphanedAt: z.number().nullable(),
  joinedAt: z.number(),
  selfMute: z.boolean(),
  selfDeaf: z.boolean(),
  serverMute: z.boolean(),
  serverDeaf: z.boolean(),
  camera: z.boolean(),
  screenShare: z.boolean(),
});
export type VoiceState = z.infer<typeof voiceStateSchema>;

export const createGuildInput = z.object({
  name: z.string().min(2).max(LIMITS.guildName),
});

export const createChannelInput = z.object({
  name: z.string().min(1).max(LIMITS.channelName),
  fonte: z.enum(FONTES_DE_NOME).optional(),
  type: z.enum(CHANNEL_TYPES),
  categoryId: objectId.nullable().optional(),
  topic: z.string().max(512).nullable().optional(),
  isPrivate: z.boolean().optional(),
});

export const createPollInput = z.object({
  pergunta: z.string().min(1).max(200),
  opcoes: z.array(z.object({ texto: z.string().min(1).max(80), emoji: z.string().nullable().optional() })).min(2).max(5),
  multiSelect: z.boolean().optional(),
  duracaoHoras: z.number().int().positive().max(720).nullable().optional(),
});

export type CreatePollInput = z.infer<typeof createPollInput>;

export const sendMessageInput = z.object({
  channelId: objectId,
  content: z.string().max(LIMITS.messageLength),
  fonte: z.enum(FONTES_DE_NOME).optional(),
  attachments: z.array(attachmentSchema).max(LIMITS.attachmentsPerMessage).optional(),
  poll: createPollInput.optional(),
  stickerId: objectId.optional(),
  postId: objectId.nullable().optional(),
  replyToId: objectId.nullable().optional(),
  nonce: z.string().max(64).optional(),
});

export const editMessageInput = z.object({
  messageId: objectId,
  content: z.string().min(1).max(LIMITS.messageLength),
});

/*
  ── Comandos de barra ────────────────────────────────────────────────────

  O bot declara o que sabe fazer; o app desenha a lista quando alguém digita
  "/". A diferença para ler texto solto é que a parte chata — descobrir que o
  comando existe, e quais argumentos ele quer — deixa de ser trabalho de quem
  digita e de quem programa o bot.
*/

/// Minúsculas, sem espaço: é o que a pessoa digita depois da barra, e o que
/// aparece na lista. Maiúscula ali só criaria dois comandos que parecem um.
const nomeDeComando = z
  .string()
  .regex(/^[a-z0-9_-]{1,32}$/, "Só minúsculas, números, hífen e sublinhado");

/**
 * Os tipos que uma opção pode ter.
 *
 * Curto de propósito. O tipo serve para duas coisas: dizer ao app como
 * desenhar a dica, e garantir ao bot que o valor chega no formato que ele
 * espera. Tipo que não muda nenhuma das duas não ganharia nada por existir.
 */
export const TIPOS_DE_OPCAO = ["texto", "numero", "usuario", "canal"] as const;
export type TipoDeOpcao = (typeof TIPOS_DE_OPCAO)[number];

export const opcaoDeComandoSchema = z.object({
  nome: nomeDeComando,
  descricao: z.string().min(1).max(100),
  tipo: z.enum(TIPOS_DE_OPCAO),
  obrigatoria: z.boolean().optional(),
});
export type OpcaoDeComando = z.infer<typeof opcaoDeComandoSchema>;

export const comandoDeBotSchema = z.object({
  nome: nomeDeComando,
  descricao: z.string().min(1).max(100),
  opcoes: z.array(opcaoDeComandoSchema).max(10).default([]),
});
export type ComandoDeBot = z.infer<typeof comandoDeBotSchema>;

/// O que o bot manda para registrar. Lista inteira de uma vez, e não um
/// comando por chamada: assim apagar é só deixar de mandar, e o bot nunca
/// precisa lembrar o que registrou da última vez.
export const definirComandosInput = z.object({
  comandos: z.array(comandoDeBotSchema).max(25),
});

/// O que o app recebe: o comando mais de quem ele é, porque dois bots no
/// mesmo servidor podem ter um "/play" cada.
export const comandoDisponivelSchema = comandoDeBotSchema.extend({
  botId: objectId,
  bot: publicUserSchema,
});
export type ComandoDisponivel = z.infer<typeof comandoDisponivelSchema>;

/// Os valores chegam como texto, sempre — é o que a pessoa digitou. Quem
/// converte é o servidor, que é onde a declaração do comando vive e onde a
/// conversão pode ser cobrada.
export const invocarComandoInput = z.object({
  channelId: objectId,
  botId: objectId,
  comando: nomeDeComando,
  opcoes: z.record(z.string(), z.string().max(2000)).default({}),
});
