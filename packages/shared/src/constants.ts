export const CHANNEL_TYPES = ["TEXT", "VOICE", "FORUM"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const PRESENCE_STATUSES = ["ONLINE", "IDLE", "DND", "OFFLINE"] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const DESIRED_STATUSES = ["ONLINE", "IDLE", "DND", "INVISIBLE"] as const;
export type DesiredStatus = (typeof DESIRED_STATUSES)[number];

export const LIMITS = {
  messageLength: 4000,
  guildName: 64,
  channelName: 48,
  username: 32,
  displayName: 48,
  attachmentsPerMessage: 10,
  attachmentBytes: 50 * 1024 * 1024,
  avatarBytes: 2 * 1024 * 1024,
  bannerBytes: 10 * 1024 * 1024,
  roleIconBytes: 256 * 1024,
  etiqueta: 6,
  emblemasPorServidor: 20,
  emblemasPorMembro: 5,
  emblemaNome: 24,
  emblemaBytes: 128 * 1024,
  statusPersonalizado: 96,
  bio: 512,
  messagePageSize: 50,
  typingTtlMs: 6000,
  emojisPorServidor: 50,
  figurinhasPorServidor: 5,
  sonsPorServidor: 8,
  figurinhaBytes: 512 * 1024,
  somBytes: 512 * 1024,
  opcoesPorEnquete: 5,
  mensagensFixadas: 50,
  modoLentoMax: 21_600,
  postTitulo: 100,
} as const;

export const FINALIDADES_DE_UPLOAD = ["anexo", "avatar", "banner", "iconeDeCargo"] as const;
export type FinalidadeDeUpload = (typeof FINALIDADES_DE_UPLOAD)[number];

export const TETO_POR_FINALIDADE: Record<FinalidadeDeUpload, number> = {
  anexo: LIMITS.attachmentBytes,
  avatar: LIMITS.avatarBytes,
  banner: LIMITS.bannerBytes,
  iconeDeCargo: LIMITS.roleIconBytes,
};

export const MODO_LENTO_OPCOES = [0, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21_600] as const;
