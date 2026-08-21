/**
 * Chaves centralizadas. Sempre use daqui — chave escrita à mão num componente é
 * como um `invalidateQueries` deixa de invalidar sem ninguém perceber.
 */
export const queryKeys = {
  auth: {
    me: "find-me",
    config: "find-auth-config",
  },

  guild: {
    find_many: "find-many-guilds",
    find: (guildId: string) => ["find-guild", guildId] as const,
    invites: (guildId: string) => ["find-guild-invites", guildId] as const,
  },

  role: {
    find_many: (guildId: string) => ["find-roles", guildId] as const,
    overwrites: (channelId: string) => ["find-channel-overwrites", channelId] as const,
  },

  webhook: {
    find_many: (guildId: string) => ["find-webhooks", guildId] as const,
  },

  expression: {
    find_many: (guildId: string) => ["find-expressions", guildId] as const,
  },

  moderation: {
    bans: (guildId: string) => ["find-bans", guildId] as const,
    audit: (guildId: string, filtro: string) => ["find-audit-log", guildId, filtro] as const,
    automod: (guildId: string) => ["find-automod", guildId] as const,
  },

  forum: {
    posts: (channelId: string) => ["find-posts", channelId] as const,
    post: (postId: string) => ["find-post", postId] as const,
  },

  gif: {
    config: "gif-config",
    trending: "gif-trending",
    search: (q: string) => ["gif-search", q] as const,
  },

  channel: {
    messages: (channelId: string) => ["find-channel-messages", channelId] as const,
    /** conversa de um assunto do fórum */
    postMessages: (postId: string) => ["find-post-messages", postId] as const,
    pins: (channelId: string) => ["find-pins", channelId] as const,
  },

  message: {
    read_states: "find-read-states",
  },

  user: {
    profile: (userId: string) => ["find-profile", userId] as const,
  },

  friend: {
    find_many: "find-many-friends",
    dms: "find-many-dms",
  },

  invite: {
    find: (code: string) => ["find-invite", code] as const,
  },
} as const;
