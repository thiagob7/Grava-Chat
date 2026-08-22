import { z } from "zod";
import { CHANNEL_TYPES, DESIRED_STATUSES, PRESENCE_STATUSES, LIMITS } from "./constants.js";
import {
  corHex,
  ESTILOS_DE_CARGO,
  estiloDePerfilSchema,
  statusPersonalizadoSchema,
} from "./cosmeticos.js";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "id invalido");

/**
 * DTOs "publicos": o formato exato que a API serializa e o front consome.
 * Nunca devolvemos o model do Prisma cru — o User do banco tem email, e o
 * email de todo mundo nao deve vazar pros outros membros do servidor.
 */
export const publicUserSchema = z.object({
  id: objectId,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  status: z.enum(PRESENCE_STATUSES),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

/*
 * ATENCAO: `publicUserSchema` NAO ganha enfeite nenhum, e isso e deliberado.
 *
 * Ele esta embutido em `messageSchema.author` — cinquenta mensagens por pagina,
 * o mesmo autor repetido. Um objeto cosmetico de duzentos bytes ali vira dez KB
 * por pagina, pra sempre, e em cada evento de socket.
 *
 * Enfeite e por USUARIO, nao por mensagem: viaja no mapa `profiles` do detalhe
 * do servidor, uma vez por pessoa. De brinde, trocar o banner deixa de invalidar
 * cache de mensagem.
 */

export const selfUserSchema = publicUserSchema.extend({
  email: z.email(),
  bio: z.string().nullable(),
  /** provedores ligados a esta conta ("google"); vazio = entrou pelo dev-login */
  providers: z.array(z.string()),
  createdAt: z.iso.datetime(),
  /** enfeites completos, inclusive os que so aparecem no proprio cartao */
  perfil: estiloDePerfilSchema.nullable(),
  statusPersonalizado: statusPersonalizadoSchema.nullable(),
  /**
   * O UNICO lugar onde `INVISIBLE` aparece. Os outros veem `status: OFFLINE`;
   * so voce sabe que escolheu ficar invisivel.
   */
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
  type: z.enum(CHANNEL_TYPES),
  topic: z.string().nullable(),
  position: z.number().int(),
  isPrivate: z.boolean(),
  /** segundos entre uma mensagem e a próxima da mesma pessoa; 0 = desligado */
  slowmodeSeconds: z.number().int(),
  contentVisibility: z.enum(["DEFAULT", "SPOILER", "AGE_RESTRICTED"]),
  /** daqui pra baixo só vale em canal de voz */
  bitrate: z.number().int(),
  videoQuality: z.enum(["AUTO", "HD"]),
  /** 0 = sem limite */
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
  /** chega borrado e só abre no clique */
  spoiler: z.boolean().optional(),
  /** texto alternativo, para quem usa leitor de tela */
  description: z.string().max(1024).nullable().optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const pollOptionSchema = z.object({
  id: z.string(),
  texto: z.string().max(80),
  emoji: z.string().nullable().optional(),
  /** quem votou nesta opção; o front conta e descobre o "eu votei" daqui */
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
  /** se o usuario que pediu ja reagiu — evita um round-trip pra pintar o botao */
  me: z.boolean(),
});
export type ReactionSummary = z.infer<typeof reactionSummarySchema>;

/**
 * Forma usada no evento de tempo real: quem reagiu, sem o "me" resolvido.
 * O "me" depende de QUEM esta olhando, entao calcular no servidor obrigaria a
 * emitir um payload diferente por socket — o que, com o adapter de Redis, faz
 * cada reacao dar a volta pelo pub/sub uma vez por espectador. Mandando os ids,
 * e uma emissao so pra sala inteira e cada cliente resolve o proprio "me".
 */
export const reactionStateSchema = z.object({
  emoji: z.string(),
  userIds: z.array(objectId),
});
export type ReactionState = z.infer<typeof reactionStateSchema>;

export const messageSchema = z.object({
  id: objectId,
  channelId: objectId,
  author: publicUserSchema,
  content: z.string(),
  /** USER é gente escrevendo; JOIN é a mensagem de boas-vindas do sistema */
  tipo: z.enum(["USER", "JOIN"]),
  attachments: z.array(attachmentSchema),
  poll: pollSchema.nullable(),
  sticker: stickerSchema.nullable(),
  reactions: z.array(reactionSummarySchema),
  /**
   * Quem foi mencionado. Vem pro front porque e o que permite destacar a
   * mensagem em que VOCE foi citado sem uma segunda consulta.
   */
  mentions: z.array(objectId),
  /** cargos mencionados; a expansao pra pessoas acontece na LEITURA, nunca aqui */
  mentionRoleIds: z.array(objectId),
  mentionEveryone: z.boolean(),
  replyToId: objectId.nullable(),
  /** assunto do fórum a que pertence; null nos canais normais */
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
  /** cargos desta pessoa; o @everyone é implícito e não aparece aqui */
  roleIds: z.array(objectId),
  nickname: z.string().nullable(),
  /** de castigo até esta hora: não escreve nem fala */
  timeoutUntil: z.iso.datetime().nullable(),
  joinedAt: z.iso.datetime(),
});

export const roleSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  color: z.string().nullable(),
  /** segunda cor do gradiente; ignorada quando o estilo nao usa duas */
  colorSecondary: z.string().nullable(),
  /** imagem OU emoji, nunca os dois — quem garante isso e o service */
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

/**
 * Um emblema do servidor: o icone que os membros podem vestir ao lado do nome.
 *
 * Quem CRIA e o servidor; quem VESTE e cada membro, por conta propria. E de
 * proposito que nao existe concessao: um emblema que precisa ser concedido vira
 * fila de pedido no ouvido do dono, e a graca aqui e a pessoa se identificar
 * com o grupo sem pedir licenca.
 */
export const emblemaSchema = z.object({
  id: objectId,
  guildId: objectId,
  nome: z.string(),
  /** emoji OU imagem, nunca os dois — quem garante isso e o service */
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

/** Estado efemero de voz — vive no Redis, nunca no Mongo. */
export const voiceStateSchema = z.object({
  userId: objectId,
  channelId: objectId,
  guildId: objectId,
  /**
   * Qual conexao (socket) esta de fato na chamada. A conta pode estar aberta em
   * varias abas, mas so UMA delas segura a sessao de midia — e sem saber qual,
   * fechar qualquer outra aba derrubaria a chamada de quem esta falando.
   */
  socketId: z.string(),
  /**
   * Momento em que a conexao dona caiu. Nao remove na hora: um reload leva
   * segundos e a pessoa espera continuar na chamada. Se ninguem reassumir
   * dentro da janela, o estado e apagado de verdade.
   */
  orphanedAt: z.number().nullable(),
  /**
   * Quando esta pessoa entrou na chamada. O menor `joinedAt` do canal e o
   * comeco da chamada — e o cronometro da barra lateral conta a partir dele.
   * Fica no estado (e nao numa variavel do cliente) pra sobreviver a reload.
   */
  joinedAt: z.number(),
  selfMute: z.boolean(),
  selfDeaf: z.boolean(),
  /** silenciado por um moderador: vale no SFU, não dá pra desfazer no cliente */
  serverMute: z.boolean(),
  serverDeaf: z.boolean(),
  camera: z.boolean(),
  screenShare: z.boolean(),
});
export type VoiceState = z.infer<typeof voiceStateSchema>;

// ---------------------------------------------------------------------------
// Payloads de entrada (usados tanto nas rotas REST quanto nos eventos de socket)
// ---------------------------------------------------------------------------

export const createGuildInput = z.object({
  name: z.string().min(2).max(LIMITS.guildName),
});

export const createChannelInput = z.object({
  name: z.string().min(1).max(LIMITS.channelName),
  type: z.enum(CHANNEL_TYPES),
  categoryId: objectId.nullable().optional(),
  topic: z.string().max(512).nullable().optional(),
  isPrivate: z.boolean().optional(),
});

export const createPollInput = z.object({
  pergunta: z.string().min(1).max(200),
  opcoes: z.array(z.object({ texto: z.string().min(1).max(80), emoji: z.string().nullable().optional() })).min(2).max(5),
  multiSelect: z.boolean().optional(),
  /** horas até fechar sozinha; null = fica aberta até o autor encerrar */
  duracaoHoras: z.number().int().positive().max(720).nullable().optional(),
});

export type CreatePollInput = z.infer<typeof createPollInput>;

export const sendMessageInput = z.object({
  channelId: objectId,
  content: z.string().max(LIMITS.messageLength),
  attachments: z.array(attachmentSchema).max(LIMITS.attachmentsPerMessage).optional(),
  poll: createPollInput.optional(),
  stickerId: objectId.optional(),
  /** responder dentro de um assunto do fórum */
  postId: objectId.nullable().optional(),
  replyToId: objectId.nullable().optional(),
  /**
   * Gerado no cliente. A mensagem aparece na tela na hora (optimistic UI) e
   * quando o servidor confirma, o front troca a temporaria pela real por esse id.
   * Sem isso a mensagem "pisca" ou aparece duplicada.
   */
  nonce: z.string().max(64).optional(),
});

export const editMessageInput = z.object({
  messageId: objectId,
  content: z.string().min(1).max(LIMITS.messageLength),
});
