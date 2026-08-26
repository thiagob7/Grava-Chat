import { z } from "zod";
import { DESIRED_STATUSES, type DesiredStatus } from "./constants.js";
import { perfilPublicoSchema } from "./cosmeticos.js";
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
  invocarComandoInput,
} from "./models.js";
import type { PresenceStatus } from "./constants.js";

export const clientEventSchemas = {
  "channel:subscribe": z.object({ channelId: objectId }),
  "channel:unsubscribe": z.object({ channelId: objectId }),

  "message:send": sendMessageInput,
  "message:edit": editMessageInput,
  "message:delete": z.object({ messageId: objectId }),
  "message:react": z.object({
    messageId: objectId,
    emoji: z.string().max(64),
    /// super reação: além de contar, dispara a animação em quem está no canal
    burst: z.boolean().optional(),
  }),
  "message:unreact": z.object({ messageId: objectId, emoji: z.string().max(64) }),
  "message:ack": z.object({ channelId: objectId, messageId: objectId }),
  /// deixa o canal não-lido A PARTIR desta mensagem: quem marca quer voltar
  /// nela depois, então o ponteiro de leitura recua para a mensagem anterior.
  "message:unread": z.object({ channelId: objectId, messageId: objectId }),

  "poll:vote": z.object({ messageId: objectId, optionId: z.string().min(1).max(64) }),
  "poll:close": z.object({ messageId: objectId }),

  "typing:start": z.object({ channelId: objectId }),

  /// A pessoa escolheu um comando de barra na lista e mandou.
  "command:invoke": invocarComandoInput,

  "presence:update": z.object({ status: z.enum(DESIRED_STATUSES) }),
  "presence:afk": z.object({ idle: z.boolean() }),

  "voice:join": z.object({
    channelId: objectId,
    resume: z.boolean().optional(),
  }),
  "voice:leave": z.object({}),
  /// Credencial do SFU para um canal. O app pega pela rota REST, com o cookie
  /// de sessão; um bot não tem cookie e só existe aqui dentro do socket.
  "voice:token": z.object({ channelId: objectId }),
  /// Em que canal de voz alguém está, se estiver em algum. Um bot que acabou
  /// de conectar não viu os "voice:joined" de quem já estava lá.
  "voice:onde": z.object({ userId: objectId }),
  "voice:sound": z.object({ soundId: objectId }),

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

export type Ack<T = void> = (res: { ok: true; data: T } | { ok: false; error: string }) => void;

export type ClientToServerEvents = {
  [E in ClientEventName]: (payload: ClientEventPayload<E>, ack?: Ack<unknown>) => void;
};

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

  /// só a animação: a contagem já foi pelo "message:reactions" de sempre
  "message:super": (p: {
    messageId: string;
    channelId: string;
    emoji: string;
    userId: string;
  }) => void;

  "typing:started": (p: { channelId: string; user: z.infer<typeof publicUserSchema> }) => void;

  /*
    O comando chegando ao bot.

    Só o bot dono do comando recebe — vai para a sala dele, e não para a do
    canal. Quem está no canal já viu a mensagem de comando aparecer; mandar o
    evento junto seria contar duas vezes a mesma coisa, e para quem não tem o
    que fazer com ela.

    `opcoes` já vem convertido: o `numero` chega número, o `usuario` e o
    `canal` chegam como id. O bot não repete a validação que o servidor fez.
  */
  "command:invoked": (p: {
    channelId: string;
    guildId: string;
    /// a mensagem "fulano usou /play", para o bot poder responder citando
    messageId: string;
    comando: string;
    opcoes: Record<string, string | number>;
    usuario: z.infer<typeof publicUserSchema>;
  }) => void;

  /// A lista de comandos de um servidor mudou: bot entrou, saiu, ou
  /// registrou outra coisa. O app recarrega em vez de ficar oferecendo
  /// comando que não existe mais.
  "commands:changed": (p: { guildId: string }) => void;

  "presence:changed": (p: { userId: string; status: PresenceStatus }) => void;
  "presence:self": (p: { status: DesiredStatus }) => void;
  "user:updated": (p: {
    user: z.infer<typeof publicUserSchema>;
    perfil: z.infer<typeof perfilPublicoSchema>;
  }) => void;

  "friend:updated": () => void;
  "dm:created": (p: { channelId: string }) => void;

  "member:joined": (member: z.infer<typeof guildMemberSchema>) => void;
  "member:updated": (member: z.infer<typeof guildMemberSchema>) => void;
  "member:left": (p: { guildId: string; userId: string }) => void;

  "channel:created": (channel: z.infer<typeof channelSchema>) => void;
  "channel:updated": (channel: z.infer<typeof channelSchema>) => void;
  "channel:deleted": (p: { channelId: string; guildId: string }) => void;
  "guild:refresh": (p: { guildId: string }) => void;
  "post:created": (post: ForumPostPayload) => void;
  "post:updated": (post: ForumPostPayload) => void;
  "expressions:changed": (p: { guildId: string }) => void;
  "guild:deleted": (p: { guildId: string }) => void;
  "guild:updated": (guild: {
    id: string;
    name: string;
    iconUrl: string | null;
    description: string | null;
    ownerId: string;
    memberCount: number;
  }) => void;

  "voice:states": (p: { channelId: string; states: z.infer<typeof voiceStateSchema>[] }) => void;
  "voice:sound": (p: { channelId: string; userId: string; url: string; volume: number }) => void;
  "voice:move": (p: { channelId: string }) => void;
  "voice:joined": (state: z.infer<typeof voiceStateSchema>) => void;
  "voice:left": (p: { channelId: string; userId: string }) => void;
  "voice:updated": (state: z.infer<typeof voiceStateSchema>) => void;

  "live:started": (p: { channelId: string; userId: string }) => void;
  "live:ended": (p: { channelId: string; userId: string }) => void;

  error: (p: { event?: string; message: string }) => void;
};

export const rooms = {
  user: (userId: string) => `user:${userId}`,
  guild: (guildId: string) => `guild:${guildId}`,
  channel: (channelId: string) => `channel:${channelId}`,
} as const;
