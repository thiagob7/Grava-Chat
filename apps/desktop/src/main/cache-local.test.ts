import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { QUEUE_KEEP_DAYS, SEND_TRIES_CEILING } from "./cache-regras";
import {
  cacheSize,
  closeCache,
  dequeueSend,
  markSendTried,
  pruneQueue,
  queueSend,
  queuedSends,
  forgetChannel,
  forgetMessage,
  openCache,
  prune,
  readChannel,
  writeMessages,
  type CachedMessage,
} from "./cache-local";

const CONTA = "6a8781da7415b08f427be1a4";
const CANAL = "6a8781db7415b08f427be1aa";

let folder: string;

const message = (id: string, when: string, patch: Partial<CachedMessage> = {}): CachedMessage => ({
  id,
  channelId: CANAL,
  createdAt: when,
  content: `mensagem ${id}`,
  ...patch,
});

beforeEach(() => {
  folder = mkdtempSync(path.join(tmpdir(), "gravae-cache-"));
  openCache(folder, CONTA);
});

afterEach(() => {
  closeCache();
  rmSync(folder, { recursive: true, force: true });
});

describe("abrir o cache", () => {
  it("conta com id torto não abre banco nenhum", () => {
    closeCache();
    expect(openCache(folder, "../../fora")).toBe(false);
  });

  it("abrir de novo a mesma conta não perde o que já estava lá", () => {
    writeMessages(CANAL, [message("a", "2026-09-10T10:00:00Z")]);
    openCache(folder, CONTA);

    expect(readChannel(CANAL)).toHaveLength(1);
  });
});

describe("guardar e ler conversa", () => {
  it("volta da mais velha para a mais nova, que é a ordem da tela", () => {
    writeMessages(CANAL, [
      message("a", "2026-09-10T10:00:00Z"),
      message("b", "2026-09-10T11:00:00Z"),
      message("c", "2026-09-10T12:00:00Z"),
    ]);

    expect(readChannel(CANAL).map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("guarda a mensagem inteira, não só o que virou coluna", () => {
    writeMessages(CANAL, [
      message("a", "2026-09-10T10:00:00Z", {
        attachments: [{ url: "foto.png" }],
        reactions: [{ emoji: "🎉" }],
      }),
    ]);

    const [voltou] = readChannel(CANAL);

    expect(voltou?.attachments).toEqual([{ url: "foto.png" }]);
    expect(voltou?.reactions).toEqual([{ emoji: "🎉" }]);
  });

  it("gravar a mesma mensagem de novo atualiza em vez de duplicar", () => {
    writeMessages(CANAL, [message("a", "2026-09-10T10:00:00Z", { content: "antes" })]);
    writeMessages(CANAL, [message("a", "2026-09-10T10:00:00Z", { content: "editada" })]);

    const tudo = readChannel(CANAL);

    expect(tudo).toHaveLength(1);
    expect(tudo[0]?.content).toBe("editada");
  });

  it("o limite recorta pelas mais novas", () => {
    writeMessages(CANAL, [
      message("a", "2026-09-10T10:00:00Z"),
      message("b", "2026-09-10T11:00:00Z"),
      message("c", "2026-09-10T12:00:00Z"),
    ]);

    expect(readChannel(CANAL, 2).map((m) => m.id)).toEqual(["b", "c"]);
  });

  it("canal sem nada volta vazio, não quebra", () => {
    expect(readChannel("6a8781db7415b08f427be1ff")).toEqual([]);
  });
});

describe("esquecer", () => {
  it("mensagem apagada no servidor sai do cache", () => {
    writeMessages(CANAL, [message("a", "2026-09-10T10:00:00Z"), message("b", "2026-09-10T11:00:00Z")]);
    forgetMessage("a");

    expect(readChannel(CANAL).map((m) => m.id)).toEqual(["b"]);
  });

  it("largar um canal leva a conversa e a marca junto", () => {
    writeMessages(CANAL, [message("a", "2026-09-10T10:00:00Z")]);
    forgetChannel(CANAL);

    expect(cacheSize()).toEqual({ messages: 0, channels: 0 });
  });
});

describe("poda", () => {
  it("tira o que passou de noventa dias e deixa o resto", () => {
    const agora = Date.parse("2026-09-12T00:00:00Z");
    const velha = new Date(agora - 200 * 86_400_000).toISOString();
    const nova = new Date(agora - 2 * 86_400_000).toISOString();

    writeMessages(CANAL, [message("velha", velha), message("nova", nova)]);

    expect(prune(agora)).toBe(1);
    expect(readChannel(CANAL).map((m) => m.id)).toEqual(["nova"]);
  });

  it("data ilegível não derruba a escrita", () => {
    expect(() => writeMessages(CANAL, [message("a", "ontem")])).not.toThrow();
    expect(readChannel(CANAL)).toHaveLength(1);
  });
});

describe("prateleira de saída", () => {
  const escrita = (nonce: string) => ({ channelId: CANAL, content: `texto ${nonce}`, nonce });

  it("guarda e devolve na ordem em que foi escrita", () => {
    queueSend("n1", CANAL, escrita("n1"));
    queueSend("n2", CANAL, escrita("n2"));

    expect(queuedSends().map((q) => q.nonce)).toEqual(["n1", "n2"]);
  });

  it("guarda o pedido inteiro, com anexo e resposta junto", () => {
    queueSend("n1", CANAL, { content: "oi", attachments: [{ url: "a.png" }], replyToId: "x" });

    const [item] = queuedSends();

    expect(item?.payload).toEqual({
      content: "oi",
      attachments: [{ url: "a.png" }],
      replyToId: "x",
    });
  });

  it("enfileirar o mesmo nonce de novo não cria segunda linha", () => {
    queueSend("n1", CANAL, escrita("n1"));
    queueSend("n1", CANAL, escrita("n1"));

    expect(queuedSends()).toHaveLength(1);
  });

  it("reenfileirar NÃO zera as tentativas, senão a condenada volta para sempre", () => {
    queueSend("n1", CANAL, escrita("n1"));
    markSendTried("n1");
    markSendTried("n1");
    queueSend("n1", CANAL, escrita("n1"));

    expect(queuedSends()[0]?.tries).toBe(2);
  });

  it("cada falha conta, e a contagem volta de quem chamou", () => {
    queueSend("n1", CANAL, escrita("n1"));

    expect(markSendTried("n1")).toBe(1);
    expect(markSendTried("n1")).toBe(2);
  });

  it("mensagem que saiu deixa a prateleira", () => {
    queueSend("n1", CANAL, escrita("n1"));
    queueSend("n2", CANAL, escrita("n2"));
    dequeueSend("n1");

    expect(queuedSends().map((q) => q.nonce)).toEqual(["n2"]);
  });

  it("desiste depois do teto de tentativas, e diz o que descartou", () => {
    queueSend("teimosa", CANAL, escrita("teimosa"));
    queueSend("nova", CANAL, escrita("nova"));

    for (let i = 0; i < SEND_TRIES_CEILING; i += 1) markSendTried("teimosa");

    expect(pruneQueue().map((q) => q.nonce)).toEqual(["teimosa"]);
    expect(queuedSends().map((q) => q.nonce)).toEqual(["nova"]);
  });

  it("desiste do que envelheceu, mesmo sem ter tentado", () => {
    const agora = Date.now();
    queueSend("velha", CANAL, escrita("velha"));

    expect(pruneQueue(agora + (QUEUE_KEEP_DAYS + 1) * 86_400_000).map((q) => q.nonce)).toEqual([
      "velha",
    ]);
  });

  it("a fila não some quando o cache de leitura é podado", () => {
    queueSend("n1", CANAL, escrita("n1"));
    writeMessages(CANAL, [message("a", "2020-01-01T00:00:00Z")]);
    prune();

    expect(queuedSends()).toHaveLength(1);
  });
});
