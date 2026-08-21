import { z } from "zod";
import {
  objectId,
  messageSchema,
  reactionStateSchema,
  publicUserSchema,
  voiceStateSchema,
  guildMemberSchema,
  channelSchema,
  sendMessageInput,
  editMessageInput,
} from "./models.js";
import type { PresenceStatus } from "./constants.js";

/**
 * Contrato dos eventos de tempo real. Front e back importam DAQUI — e a unica
 * forma de garantir que os dois lados falam a mesma lingua. Se um evento nao
 * esta aqui, ele nao existe.
 */

// --------------------------- cliente -> servidor ---------------------------

export const clientEventSchemas = {
  "channel:subscribe": z.object({ channelId: objectId }),
  "channel:unsubscribe": z.object({ channelId: objectId }),

  "message:send": sendMessageInput,
  "message:edit": editMessageInput,
  "message:delete": z.object({ messageId: objectId }),
  "message:react": z.object({ messageId: objectId, emoji: z.string().max(64) }),
  "message:unreact": z.object({ messageId: objectId, emoji: z.string().max(64) }),
  "message:ack": z.object({ channelId: objectId, messageId: objectId }),

  /** Um clique na opção já marcada tira o voto — o servidor decide qual é o caso. */
  "poll:vote": z.object({ messageId: objectId, optionId: z.string().min(1).max(64) }),
  "poll:close": z.object({ messageId: objectId }),

  "typing:start": z.object({ channelId: objectId }),

  "presence:update": z.object({ status: z.enum(["ONLINE", "IDLE", "DND"]) }),

  "voice:join": z.object({
    channelId: objectId,
    /**
     * Retomar apos um reload, e nao entrar de novo. O servidor so aceita se a
     * chamada estiver orfa — assim a aba que voltou reassume, mas uma aba que
     * reabre nao rouba a chamada de outra que esta ao vivo.
     */
    resume: z.boolean().optional(),
  }),
  "voice:leave": z.object({}),
  /** Toca um som do painel para todo mundo que está na chamada. */
  "voice:sound": z.object({ soundId: objectId }),

  /** Moderação de voz: vale no SFU, não é pedido gentil ao cliente do outro. */
  "voice:moderate": z.object({
    userId: objectId,
    serverMute: z.boolean().optional(),
    serverDeaf: z.boolean().optional(),
  }),
  "voice:kick": z.object({ userId: objectId }),
  "voice:moveMember": z.object({ userId: objectId, channelId: objectId }),
  "voice:state": z.object({
    selfMute: z.boolean().optional(),
    selfDeaf: z.boolean().optional(),
    camera: z.boolean().optional(),
    screenShare: z.boolean().optional(),
  }),
} as const;

export type ClientEventName = keyof typeof clientEventSchemas;
export type ClientEventPayload<E extends ClientEventName> = z.infer<(typeof clientEventSchemas)[E]>;

/** Toda emissao do cliente responde por callback — sucesso ou erro legivel. */
export type Ack<T = void> = (res: { ok: true; data: T } | { ok: false; error: string }) => void;

export type ClientToServerEvents = {
  [E in ClientEventName]: (payload: ClientEventPayload<E>, ack?: Ack<unknown>) => void;
};

// --------------------------- servidor -> cliente ---------------------------

export interface ForumPostPayload {
  id: string;
  channelId: string;
  guildId: string;
  author: z.infer<typeof publicUserSchema>;
  title: string;
  tags: string[];
  messageCount: number;
  lastMessageAt: string;
  closedAt: string | null;
  createdAt: string;
}

export type ServerToClientEvents = {
  "message:created": (msg: z.infer<typeof messageSchema> & { nonce?: string }) => void;
  "message:updated": (msg: z.infer<typeof messageSchema>) => void;
  "message:deleted": (p: { messageId: string; channelId: string }) => void;
  "message:reactions": (p: {
    messageId: string;
    channelId: string;
    reactions: z.infer<typeof reactionStateSchema>[];
  }) => void;

  "typing:started": (p: { channelId: string; user: z.infer<typeof publicUserSchema> }) => void;

  "presence:changed": (p: { userId: string; status: PresenceStatus }) => void;

  /** Alguem te mandou pedido de amizade, ou respondeu o seu. */
  "friend:updated": () => void;
  /** Uma DM nova apareceu (a outra pessoa iniciou a conversa). */
  "dm:created": (p: { channelId: string }) => void;

  "member:joined": (member: z.infer<typeof guildMemberSchema>) => void;
  /** Cargos ou apelido de alguém mudaram. */
  "member:updated": (member: z.infer<typeof guildMemberSchema>) => void;
  "member:left": (p: { guildId: string; userId: string }) => void;

  "channel:created": (channel: z.infer<typeof channelSchema>) => void;
  "channel:updated": (channel: z.infer<typeof channelSchema>) => void;
  "channel:deleted": (p: { channelId: string; guildId: string }) => void;
  /**
   * Cargos ou permissões de canal mudaram. Não mandamos o estado novo porque
   * ele é diferente para cada pessoa (um canal pode sumir para uma e aparecer
   * para outra); cada cliente recarrega o servidor e recebe a sua versão.
   */
  "guild:refresh": (p: { guildId: string }) => void;
  /** Assunto novo no fórum, ou um assunto que mudou (fechou, por exemplo). */
  "post:created": (post: ForumPostPayload) => void;
  "post:updated": (post: ForumPostPayload) => void;
  /** Emoji, figurinha ou som do servidor mudou. */
  "expressions:changed": (p: { guildId: string }) => void;
  /** O servidor inteiro deixou de existir. */
  "guild:deleted": (p: { guildId: string }) => void;
  /** Nome, ícone ou descrição mudaram. */
  "guild:updated": (guild: {
    id: string;
    name: string;
    iconUrl: string | null;
    description: string | null;
    ownerId: string;
    memberCount: number;
  }) => void;

  "voice:states": (p: { channelId: string; states: z.infer<typeof voiceStateSchema>[] }) => void;
  /** Alguém apertou um som do painel; cada cliente toca o arquivo. */
  "voice:sound": (p: { channelId: string; userId: string; url: string; volume: number }) => void;
  /** Um moderador te puxou para outro canal de voz. */
  "voice:move": (p: { channelId: string }) => void;
  "voice:joined": (state: z.infer<typeof voiceStateSchema>) => void;
  "voice:left": (p: { channelId: string; userId: string }) => void;
  "voice:updated": (state: z.infer<typeof voiceStateSchema>) => void;

  "live:started": (p: { channelId: string; userId: string }) => void;
  "live:ended": (p: { channelId: string; userId: string }) => void;

  error: (p: { event?: string; message: string }) => void;
};

// ------------------------------- salas -------------------------------------

/** Nomes de sala do Socket.IO. Centralizado pra nao ter string solta divergindo. */
export const rooms = {
  user: (userId: string) => `user:${userId}`,
  guild: (guildId: string) => `guild:${guildId}`,
  channel: (channelId: string) => `channel:${channelId}`,
} as const;
