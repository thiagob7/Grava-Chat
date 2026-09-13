import type { MessageModel } from "~/@core/domain/models/message-model";
import { desktop } from "~/lib/desktop";

/*
  A conversa guardada no disco de quem usa.

  Só existe no aplicativo de desktop, onde há um SQLite do outro lado da ponte.
  No navegador toda função aqui é gentilmente inútil: devolve vazio, devolve
  zero, não faz nada. É de propósito — quem chama não precisa perguntar onde
  está rodando, e o caminho do navegador continua sendo exatamente o de antes.

  E nada disto é fonte da verdade. O servidor é. Se o arquivo sumir, se a
  pessoa formatar o computador ou desinstalar o aplicativo, não se perde
  conversa nenhuma: na próxima abertura o aplicativo baixa de novo e o disco se
  reconstrói. É cache, e cache pode morrer.
*/
const store = () => desktop()?.cache ?? null;

export const conversationOnDisk = {
  /** Se existe disco para escrever. Falso no navegador e em casca antiga. */
  available: () => store() !== null,

  async open(accountId: string): Promise<boolean> {
    return (await store()?.open(accountId)) ?? false;
  },

  async close(): Promise<void> {
    await store()?.close();
  },

  async read(channelId: string, limit?: number): Promise<MessageModel[]> {
    const rows = await store()?.read(channelId, limit);
    return (rows as MessageModel[] | undefined) ?? [];
  },

  async write(channelId: string, messages: MessageModel[]): Promise<number> {
    if (!messages.length) return 0;
    return (await store()?.write(channelId, messages)) ?? 0;
  },

  async forgetMessage(messageId: string): Promise<void> {
    await store()?.forgetMessage(messageId);
  },

  async forgetChannel(channelId: string): Promise<void> {
    await store()?.forgetChannel(channelId);
  },

  async prune(): Promise<number> {
    return (await store()?.prune()) ?? 0;
  },
};
