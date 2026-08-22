export const CHANNEL_TYPES = ["TEXT", "VOICE", "FORUM"] as const;
export type ChannelType = (typeof CHANNEL_TYPES)[number];

export const PRESENCE_STATUSES = ["ONLINE", "IDLE", "DND", "OFFLINE"] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

/**
 * O que a pessoa ESCOLHE ser. Diferente do que os outros VEEM.
 *
 * `INVISIBLE` de propósito nao entra em `PRESENCE_STATUSES`: se entrasse,
 * vazaria pro `publicUserSchema`, pro enum do Prisma e pra todo consumidor que
 * hoje espera quatro valores. Invisivel e um estado desejado cuja projecao
 * publica e `OFFLINE` — quem faz essa traducao e `presenceService.visible()`.
 *
 * `OFFLINE` nao e escolhivel: ficar offline e consequencia de desconectar.
 */
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
  /**
   * Tetos por FINALIDADE. O de anexo (50 MB) e absurdo pra uma imagem
   * renderizada a 20px ao lado de cada nome — sem separar, o icone de cargo
   * herdaria esse teto.
   */
  avatarBytes: 2 * 1024 * 1024,
  /**
   * O banner e o unico que aceita GIF animado — e GIF nao passa pelo
   * redimensionador do navegador (o canvas mataria a animacao), entao ele sobe
   * como esta. Dez MB e o mesmo teto do Discord: menos que isso recusa GIF que
   * as pessoas acham normal usar.
   */
  bannerBytes: 10 * 1024 * 1024,
  roleIconBytes: 256 * 1024,
  /** etiqueta: o nome curto que a pessoa escolhe pra si */
  etiqueta: 6,
  /** emblemas que um servidor pode criar, e quantos cada pessoa veste */
  emblemasPorServidor: 20,
  emblemasPorMembro: 5,
  emblemaNome: 24,
  emblemaBytes: 128 * 1024,
  /** texto do status personalizado */
  statusPersonalizado: 96,
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

/**
 * Para que serve o arquivo que esta subindo.
 *
 * Sem isto todo upload herda o teto de anexo — cinquenta megabytes para uma
 * imagem que sera renderizada a vinte pixels ao lado de um nome. O teto nao e
 * so economia de disco: e o que impede alguem de pendurar um GIF de 5 MB no
 * icone de um cargo que carrega em toda linha de chat, para todo mundo.
 */
export const FINALIDADES_DE_UPLOAD = ["anexo", "avatar", "banner", "iconeDeCargo"] as const;
export type FinalidadeDeUpload = (typeof FINALIDADES_DE_UPLOAD)[number];

export const TETO_POR_FINALIDADE: Record<FinalidadeDeUpload, number> = {
  anexo: LIMITS.attachmentBytes,
  avatar: LIMITS.avatarBytes,
  banner: LIMITS.bannerBytes,
  iconeDeCargo: LIMITS.roleIconBytes,
};

/** Passos do modo lento na tela — os mesmos do Discord. */
export const MODO_LENTO_OPCOES = [0, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600, 7200, 21_600] as const;
