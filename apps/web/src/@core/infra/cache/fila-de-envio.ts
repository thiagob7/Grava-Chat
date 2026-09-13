import type { QueuedSend } from "@gravae/shared";
import { desktop } from "~/lib/desktop";

/*
  A fila de mensagens que ainda não saíram.

  Como o cache de conversa, só existe no aplicativo de desktop. No navegador
  todo método aqui é inútil de propósito: devolve vazio, devolve zero, não faz
  nada — e a mensagem falha exatamente como falhava antes.

  Isso não é limitação preguiçosa. Guardar fila numa aba é prometer o que não
  se cumpre: fechar a aba levaria junto o que estava esperando, e a pessoa
  acharia que mandou.
*/
const store = () => desktop()?.queue ?? null;

const listeners = new Set<() => void>();

export const sendQueue = {
  available: () => store() !== null,

  async put(nonce: string, channelId: string, payload: unknown): Promise<void> {
    await store()?.put(nonce, channelId, payload);
    listeners.forEach((listener) => listener());
  },

  /* Avisa o vigia de que entrou coisa nova, para ele não esperar a conexão cair e voltar. */
  onPut(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async list(): Promise<QueuedSend[]> {
    return (await store()?.list()) ?? [];
  },

  async take(nonce: string): Promise<void> {
    await store()?.take(nonce);
  },

  async tried(nonce: string): Promise<number> {
    return (await store()?.tried(nonce)) ?? 0;
  },

  async prune(): Promise<QueuedSend[]> {
    return (await store()?.prune()) ?? [];
  },
};
