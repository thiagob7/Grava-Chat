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

import { Rest, type OpcoesDoCliente } from "./rest.js";

export { ErroDaApi, motivoDoErro, adiantaInsistir } from "./rest.js";
export type { OpcoesDoCliente } from "./rest.js";

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

  constructor(opcoes: OpcoesDoCliente) {
    this.rest = new Rest(opcoes);
    this.token = opcoes.token;
    this.base = (opcoes.base ?? "https://gravaechat-api.duckdns.org/api").replace(/\/api\/?$/, "");
  }

  // ---- identidade ----

  eu() {
    return this.rest.pedir<PublicUser>("GET", "/bot/eu");
  }

  // ---- servidores e canais ----

  servidores() {
    return this.rest.pedir<Guild[]>("GET", "/bot/servidores");
  }

  canais(guildId: string) {
    return this.rest.pedir<Channel[]>("GET", `/bot/servidores/${guildId}/canais`);
  }

  criarCanal(guildId: string, dados: { name: string; type?: "TEXT" | "VOICE" | "FORUM" }) {
    return this.rest.pedir<Channel>("POST", `/bot/servidores/${guildId}/canais`, dados);
  }

  // ---- membros e cargos ----

  membros(guildId: string) {
    return this.rest.pedir<GuildMember[]>("GET", `/bot/servidores/${guildId}/membros`);
  }

  cargos(guildId: string) {
    return this.rest.pedir<Role[]>("GET", `/bot/servidores/${guildId}/cargos`);
  }

  darCargos(guildId: string, userId: string, roleIds: string[]) {
    return this.rest.pedir<GuildMember>(
      "PUT",
      `/bot/servidores/${guildId}/membros/${userId}/cargos`,
      { roleIds },
    );
  }

  // ---- moderação ----

  castigar(guildId: string, userId: string, minutos: number, reason?: string) {
    return this.rest.pedir("PUT", `/bot/servidores/${guildId}/castigos/${userId}`, {
      minutos,
      reason,
    });
  }

  banir(guildId: string, userId: string, opcoes: { reason?: string; apagarHoras?: number } = {}) {
    return this.rest.pedir("PUT", `/bot/servidores/${guildId}/banimentos/${userId}`, opcoes);
  }

  // ---- expressões ----

  expressoes(guildId: string) {
    return this.rest.pedir<{ emojis: GuildEmoji[] }>(
      "GET",
      `/bot/servidores/${guildId}/expressoes`,
    );
  }

  // ---- mensagens ----

  enviar(channelId: string, conteudo: string | { content: string; replyToId?: string }) {
    const corpo = typeof conteudo === "string" ? { content: conteudo } : conteudo;

    return this.rest.pedir<Message>("POST", `/bot/canais/${channelId}/mensagens`, corpo);
  }

  historico(channelId: string, opcoes: { before?: string; limit?: number } = {}) {
    const busca = new URLSearchParams();

    if (opcoes.before) busca.set("before", opcoes.before);
    if (opcoes.limit) busca.set("limit", String(opcoes.limit));

    const cauda = busca.size ? `?${busca}` : "";

    return this.rest.pedir<Message[]>("GET", `/bot/canais/${channelId}/mensagens${cauda}`);
  }

  editar(messageId: string, content: string) {
    return this.rest.pedir<Message>("PATCH", `/bot/mensagens/${messageId}`, { content });
  }

  apagar(messageId: string) {
    return this.rest.pedir<void>("DELETE", `/bot/mensagens/${messageId}`);
  }

  reagir(messageId: string, emoji: string) {
    return this.rest.pedir("PUT", `/bot/mensagens/${messageId}/reacoes/${encodeURIComponent(emoji)}`);
  }

  fixar(messageId: string) {
    return this.rest.pedir("PUT", `/bot/mensagens/${messageId}/fixar`);
  }

  // ---- comandos de barra ----

  definirComandos(comandos: unknown[]) {
    return this.rest.pedir("PUT", "/bot/comandos", { comandos });
  }

  // ---- tempo real ----

  /**
   * Abre a conexão. O bot NÃO precisa se inscrever em canal: ao conectar, ele
   * já recebe tudo o que o cargo dele alcança.
   */
  conectar() {
    if (this.socket) return this.socket;

    this.socket = io(this.base, {
      auth: { token: `Bot ${this.token}` },
      transports: ["websocket"],
    });

    return this.socket;
  }

  /** Escuta um evento do servidor, com o tipo certo do payload. */
  ao<E extends keyof ServerToClientEvents>(evento: E, ouvinte: ServerToClientEvents[E]) {
    this.conectar().on(evento as string, ouvinte as never);
    return this;
  }

  desconectar() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
