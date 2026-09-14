import type { DatabaseSync as SqliteDatabase } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

import {
  KEEP_MESSAGES,
  QUEUE_KEEP_DAYS,
  SEND_TRIES_CEILING,
  accountFile,
  cutOff,
  pageSize,
  whenIn,
} from "./cache-regras.js";

export interface CachedMessage {
  id: string;
  channelId: string;
  createdAt: string | number;
  [field: string]: unknown;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS mensagem (
    id        TEXT PRIMARY KEY,
    canal_id  TEXT NOT NULL,
    criada_em INTEGER NOT NULL,
    corpo     TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS mensagem_por_canal
    ON mensagem (canal_id, criada_em DESC);

  CREATE TABLE IF NOT EXISTS canal (
    id             TEXT PRIMARY KEY,
    ultima_msg_id  TEXT,
    visto_em       INTEGER NOT NULL
  );

  /*
    A prateleira de saída.

    Aqui espera o que a pessoa escreveu e ainda não chegou ao servidor. A chave
    é o nonce, o mesmo que vai no envio: é ele que deixa o servidor reconhecer
    o reenvio como a mesma mensagem, em vez de criar outra.

    A coluna corpo guarda o pedido de envio inteiro em JSON, não campo a campo.
    Quem manda tem anexo, enquete, figurinha, resposta, encaminhamento, e a
    forma disso muda com o tempo. Guardando cru, a fila não quebra quando o
    formato muda.
  */
  CREATE TABLE IF NOT EXISTS pendente (
    nonce      TEXT PRIMARY KEY,
    canal_id   TEXT NOT NULL,
    criada_em  INTEGER NOT NULL,
    tentativas INTEGER NOT NULL DEFAULT 0,
    corpo      TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS pendente_por_idade ON pendente (criada_em);
`;

const { DatabaseSync } = process.getBuiltinModule("node:sqlite");

let db: SqliteDatabase | null = null;
let openAccount: string | null = null;

function need(): SqliteDatabase {
  if (!db) throw new Error("cache não está aberto");
  return db;
}

export function openCache(userDataDir: string, accountId: string): boolean {
  const file = accountFile(accountId);
  if (!file) return false;

  if (openAccount === accountId && db) return true;

  closeCache();

  const folder = path.join(userDataDir, "cache-de-conversa");
  mkdirSync(folder, { recursive: true });

  const opened = new DatabaseSync(path.join(folder, file));

  opened.exec("PRAGMA journal_mode = WAL");
  opened.exec("PRAGMA synchronous = NORMAL");
  opened.exec(SCHEMA);

  db = opened;
  openAccount = accountId;

  return true;
}

export function closeCache(): void {
  db?.close();
  db = null;
  openAccount = null;
}

export function writeMessages(channelId: string, messages: CachedMessage[]): number {
  if (!messages.length) return 0;

  const banco = need();
  const save = banco.prepare(
    "INSERT OR REPLACE INTO mensagem (id, canal_id, criada_em, corpo) VALUES (?, ?, ?, ?)",
  );

  banco.exec("BEGIN");

  try {
    for (const message of messages) {
      save.run(message.id, channelId, whenIn(message.createdAt), JSON.stringify(message));
    }

    const newest = messages[messages.length - 1];

    banco
      .prepare(
        "INSERT INTO canal (id, ultima_msg_id, visto_em) VALUES (?, ?, ?) " +
          "ON CONFLICT(id) DO UPDATE SET ultima_msg_id = excluded.ultima_msg_id, visto_em = excluded.visto_em",
      )
      .run(channelId, newest?.id ?? null, Date.now());

    banco.exec("COMMIT");
  } catch (error) {
    banco.exec("ROLLBACK");
    throw error;
  }

  return messages.length;
}

export function readChannel(channelId: string, limit?: number): CachedMessage[] {
  const rows = need()
    .prepare(
      "SELECT corpo FROM mensagem WHERE canal_id = ? ORDER BY criada_em DESC, id DESC LIMIT ?",
    )
    .all(channelId, pageSize(limit)) as { corpo: string }[];

  return rows.reverse().map((row) => JSON.parse(row.corpo) as CachedMessage);
}

export function forgetMessage(messageId: string): void {
  need().prepare("DELETE FROM mensagem WHERE id = ?").run(messageId);
}

export function forgetChannel(channelId: string): void {
  const banco = need();
  banco.prepare("DELETE FROM mensagem WHERE canal_id = ?").run(channelId);
  banco.prepare("DELETE FROM canal WHERE id = ?").run(channelId);
}

export function prune(now = Date.now()): number {
  const banco = need();

  const old = banco
    .prepare("DELETE FROM mensagem WHERE criada_em < ?")
    .run(cutOff(now)).changes;

  const over = banco
    .prepare(
      "DELETE FROM mensagem WHERE id IN (" +
        "SELECT id FROM mensagem ORDER BY criada_em DESC, id DESC LIMIT -1 OFFSET ?)",
    )
    .run(KEEP_MESSAGES).changes;

  return Number(old) + Number(over);
}

export function cacheSize(): { messages: number; channels: number } {
  const banco = need();

  return {
    messages: Number(
      (banco.prepare("SELECT COUNT(*) AS total FROM mensagem").get() as { total: number }).total,
    ),
    channels: Number(
      (banco.prepare("SELECT COUNT(*) AS total FROM canal").get() as { total: number }).total,
    ),
  };
}

export interface QueuedSend {
  nonce: string;
  channelId: string;
  createdAt: number;
  tries: number;
  payload: unknown;
}

export function queueSend(nonce: string, channelId: string, payload: unknown): void {
  need()
    .prepare(
      "INSERT INTO pendente (nonce, canal_id, criada_em, tentativas, corpo) VALUES (?, ?, ?, 0, ?) " +
        "ON CONFLICT(nonce) DO UPDATE SET corpo = excluded.corpo",
    )
    .run(nonce, channelId, Date.now(), JSON.stringify(payload));
}

export function queuedSends(): QueuedSend[] {
  const rows = need()
    .prepare(
      "SELECT nonce, canal_id, criada_em, tentativas, corpo FROM pendente ORDER BY criada_em ASC",
    )
    .all() as { nonce: string; canal_id: string; criada_em: number; tentativas: number; corpo: string }[];

  return rows.map((row) => ({
    nonce: row.nonce,
    channelId: row.canal_id,
    createdAt: Number(row.criada_em),
    tries: Number(row.tentativas),
    payload: JSON.parse(row.corpo) as unknown,
  }));
}

export function dequeueSend(nonce: string): void {
  need().prepare("DELETE FROM pendente WHERE nonce = ?").run(nonce);
}

export function markSendTried(nonce: string): number {
  const banco = need();
  banco.prepare("UPDATE pendente SET tentativas = tentativas + 1 WHERE nonce = ?").run(nonce);

  const row = banco
    .prepare("SELECT tentativas FROM pendente WHERE nonce = ?")
    .get(nonce) as { tentativas: number } | undefined;

  return Number(row?.tentativas ?? 0);
}

export function pruneQueue(now = Date.now()): QueuedSend[] {
  const banco = need();

  const doomed = queuedSends().filter(
    (item) => item.tries >= SEND_TRIES_CEILING || item.createdAt < cutOff(now, QUEUE_KEEP_DAYS),
  );

  for (const item of doomed) {
    banco.prepare("DELETE FROM pendente WHERE nonce = ?").run(item.nonce);
  }

  return doomed;
}
