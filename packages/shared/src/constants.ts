export const CHANNEL_TYPES = ["TEXT", "VOICE", "FORUM"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const PRESENCE_STATUSES = ["ONLINE", "IDLE", "DND", "OFFLINE"] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const LIMITS = {
  messageLength: 4000,
  guildName: 64,
  channelName: 48,
  username: 32,
  displayName: 48,
  attachmentsPerMessage: 10,
  attachmentBytes: 50 * 1024 * 1024,
  messagePageSize: 50,
  typingTtlMs: 6000,
  /** expressões do servidor */
  emojisPorServidor: 50,
  figurinhasPorServidor: 5,
  sonsPorServidor: 8,
  /** figurinha e som são carregados junto com a tela: têm que ser leves */
  figurinhaBytes: 512 * 1024,
  somBytes: 512 * 1024,
  opcoesPorEnquete: 5,
  mensagensFixadas: 50,
  /** teto do modo lento, em segundos (6h como no Discord) */
  modoLentoMax: 21_600,
  postTitulo: 100,
} as const;

/** Passos do modo lento na tela — os mesmos do Discord. */
export const MODO_LENTO_OPCOES = [0, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21_600] as const;
