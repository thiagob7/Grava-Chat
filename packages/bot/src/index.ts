import { io, type Socket } from "socket.io-client";
import type {
  Channel,
  Guild,
  GuildEmoji,
  GuildMember,
  Message,
  PublicUser,
  Role,
  ServerToClientEvents,
} from "@gravae/shared";

import { Rest, type ClientOptions } from "./rest.js";

export { ApiError, errorReason, helpsInsist } from "./rest.js";
export type { ClientOptions } from "./rest.js";

/*
  O cliente é fino de propósito.

  Ele resolve as três coisas que todo mundo reescreve errado — o cabeçalho, o
  formato do erro e a decisão de insistir — e mais nada. Os tipos vêm do
  @gravae/shared, o mesmo pacote que o servidor usa para validar, então não
  existe cópia de tipo que possa envelhecer.
*/
export class Gravae {
  readonly rest: Rest;
  private socket: Socket | null = null;
  private readonly base: string;
  private readonly token: string;

  constructor(options: ClientOptions) {
    this.rest = new Rest(options);
    this.token = options.token;
    this.base = (options.base ?? "https://gravaechat-api.duckdns.org/api").replace(/\/api\/?$/, "");
  }

  // ---- identidade ----

  eu() {
    return this.rest.askFor<PublicUser>("GET", "/bot/eu");
  }

  // ---- servidores e canais ----

  servers() {
    return this.rest.askFor<Guild[]>("GET", "/bot/servidores");
  }

  channels(guildId: string) {
    return this.rest.askFor<Channel[]>("GET", `/bot/servidores/${guildId}/canais`);
  }

  createChannel(guildId: string, data: { name: string; type?: "TEXT" | "VOICE" | "FORUM" }) {
    return this.rest.askFor<Channel>("POST", `/bot/servidores/${guildId}/canais`, data);
  }

  // ---- membros e cargos ----

  members(guildId: string) {
    return this.rest.askFor<GuildMember[]>("GET", `/bot/servidores/${guildId}/membros`);
  }

  roleList(guildId: string) {
    return this.rest.askFor<Role[]>("GET", `/bot/servidores/${guildId}/cargos`);
  }

  giveRoles(guildId: string, userId: string, roleIds: string[]) {
    return this.rest.askFor<GuildMember>(
      "PUT",
      `/bot/servidores/${guildId}/membros/${userId}/cargos`,
      { roleIds },
    );
  }

  // ---- moderação ----

  timeout(guildId: string, userId: string, minutes: number, reason?: string) {
    return this.rest.askFor("PUT", `/bot/servidores/${guildId}/castigos/${userId}`, {
      minutes,
      reason,
    });
  }

  ban(guildId: string, userId: string, options: { reason?: string; deleteHours?: number } = {}) {
    return this.rest.askFor("PUT", `/bot/servidores/${guildId}/banimentos/${userId}`, options);
  }

  // ---- expressões ----

  expressions(guildId: string) {
    return this.rest.askFor<{ emojis: GuildEmoji[] }>(
      "GET",
      `/bot/servidores/${guildId}/expressoes`,
    );
  }

  // ---- mensagens ----

  send(channelId: string, content: string | { content: string; replyToId?: string }) {
    const body = typeof content === "string" ? { content: content } : content;

    return this.rest.askFor<Message>("POST", `/bot/canais/${channelId}/mensagens`, body);
  }

  past(channelId: string, options: { before?: string; limit?: number } = {}) {
    const search = new URLSearchParams();

    if (options.before) search.set("before", options.before);
    if (options.limit) search.set("limit", String(options.limit));

    const cauda = search.size ? `?${search}` : "";

    return this.rest.askFor<Message[]>("GET", `/bot/canais/${channelId}/mensagens${cauda}`);
  }

  edit(messageId: string, content: string) {
    return this.rest.askFor<Message>("PATCH", `/bot/mensagens/${messageId}`, { content });
  }

  doDelete(messageId: string) {
    return this.rest.askFor<void>("DELETE", `/bot/mensagens/${messageId}`);
  }

  react(messageId: string, emoji: string) {
    return this.rest.askFor("PUT", `/bot/mensagens/${messageId}/reacoes/${encodeURIComponent(emoji)}`);
  }

  pin(messageId: string) {
    return this.rest.askFor("PUT", `/bot/mensagens/${messageId}/fixar`);
  }

  // ---- comandos de barra ----

  setCommands(commands: unknown[]) {
    return this.rest.askFor("PUT", "/bot/comandos", { commands });
  }

  // ---- tempo real ----

  /**
   * Abre a conexão. O bot NÃO precisa se inscrever em canal: ao conectar, ele
   * já recebe tudo o que o cargo dele alcança.
   */
  connect() {
    if (this.socket) return this.socket;

    this.socket = io(this.base, {
      auth: { token: `Bot ${this.token}` },
      transports: ["websocket"],
    });

    return this.socket;
  }

  /** Escuta um evento do servidor, com o tipo certo do payload. */
  ao<E extends keyof ServerToClientEvents>(event: E, listener: ServerToClientEvents[E]) {
    this.connect().on(event as string, listener as never);
    return this;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
