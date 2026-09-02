export const queryKeys = {
  auth: {
    me: "find-me",
    config: "find-auth-config",
  },

  status: {
    find: "find-server-status",
  },

  guild: {
    find_many: "find-many-guilds",
    find: (guildId: string) => ["find-guild", guildId] as const,
    preview: (guildId: string) => ["find-guild-preview", guildId] as const,
    invites: (guildId: string) => ["find-guild-invites", guildId] as const,
    moderation: "find-moderation-view",
    moderation_messages: "find-moderation-messages",
  },

  role: {
    find_many: (guildId: string) => ["find-roles", guildId] as const,
    overwrites: (channelId: string) => ["find-channel-overwrites", channelId] as const,
  },

  webhook: {
    find_many: (guildId: string) => ["find-webhooks", guildId] as const,
  },

  comando: {
    find_many: (guildId: string) => ["find-comandos", guildId] as const,
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

  embed: {
    link: (url: string) => ["find-embed", url] as const,
  },

  gif: {
    config: "gif-config",
    trending: "gif-trending",
    search: (q: string) => ["gif-search", q] as const,
    categories: "gif-categories",
    favorites: "gif-favorites",
  },

  channel: {
    messages: (channelId: string) => ["find-channel-messages", channelId] as const,
    postMessages: (postId: string) => ["find-post-messages", postId] as const,
    pins: (channelId: string) => ["find-pins", channelId] as const,
  },

  message: {
    mentions: "find-mentions",
    read_states: "find-read-states",
    favorites: "find-favorite-messages",
    favorite_ids: "find-favorite-message-ids",
    busca: (guildId: string, termo: string, canalId: string, autorId: string) =>
      ["buscar-mensagens", guildId, termo, canalId, autorId] as const,
  },

  bot: {
    find_many: "find-bots",
    invite: (botId: string) => ["find-bot-invite", botId] as const,
    guilds: (botId: string) => ["find-bot-guilds", botId] as const,
    destinations: (botId: string) => ["find-bot-destinations", botId] as const,
  },

  user: {
    profile: (userId: string) => ["find-profile", userId] as const,
    emComum: (userId: string) => ["find-em-comum", userId] as const,
  },

  friend: {
    ativos: "find-friends-ativos",
    find_many: "find-many-friends",
    dms: "find-many-dms",
  },

  invite: {
    find: (code: string) => ["find-invite", code] as const,
  },
} as const;
