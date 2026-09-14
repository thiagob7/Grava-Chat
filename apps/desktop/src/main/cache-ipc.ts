import { app, ipcMain } from "electron";

import {
  cacheSize,
  closeCache,
  forgetChannel,
  forgetMessage,
  dequeueSend,
  markSendTried,
  openCache,
  prune,
  pruneQueue,
  queueSend,
  queuedSends,
  readChannel,
  writeMessages,
  type CachedMessage,
  type QueuedSend,
} from "./cache-local.js";

function quiet<T>(what: string, neutral: T, run: () => T): T {
  try {
    return run();
  } catch (error) {
    console.error(`[cache:${what}]`, error instanceof Error ? error.message : error);
    return neutral;
  }
}

export function registerCache(): void {
  ipcMain.handle("cache:abrir", (_e, accountId: unknown) =>
    typeof accountId === "string"
      ? quiet("abrir", false, () => openCache(app.getPath("userData"), accountId))
      : false,
  );

  ipcMain.handle("cache:fechar", () => quiet("fechar", undefined, closeCache));

  ipcMain.handle("cache:ler", (_e, channelId: unknown, limit: unknown) =>
    typeof channelId === "string"
      ? quiet("ler", [] as CachedMessage[], () =>
          readChannel(channelId, typeof limit === "number" ? limit : undefined),
        )
      : [],
  );

  ipcMain.handle("cache:gravar", (_e, channelId: unknown, messages: unknown) =>
    typeof channelId === "string" && Array.isArray(messages)
      ? quiet("gravar", 0, () => writeMessages(channelId, messages as CachedMessage[]))
      : 0,
  );

  ipcMain.handle("cache:esquecer-mensagem", (_e, messageId: unknown) =>
    typeof messageId === "string"
      ? quiet("esquecer-mensagem", undefined, () => forgetMessage(messageId))
      : undefined,
  );

  ipcMain.handle("cache:esquecer-canal", (_e, channelId: unknown) =>
    typeof channelId === "string"
      ? quiet("esquecer-canal", undefined, () => forgetChannel(channelId))
      : undefined,
  );

  ipcMain.handle("cache:podar", () => quiet("podar", 0, () => prune()));

  ipcMain.handle("fila:por", (_e, nonce: unknown, channelId: unknown, payload: unknown) =>
    typeof nonce === "string" && typeof channelId === "string"
      ? quiet("fila-por", undefined, () => queueSend(nonce, channelId, payload))
      : undefined,
  );

  ipcMain.handle("fila:listar", () => quiet("fila-listar", [] as QueuedSend[], queuedSends));

  ipcMain.handle("fila:tirar", (_e, nonce: unknown) =>
    typeof nonce === "string"
      ? quiet("fila-tirar", undefined, () => dequeueSend(nonce))
      : undefined,
  );

  ipcMain.handle("fila:tentou", (_e, nonce: unknown) =>
    typeof nonce === "string" ? quiet("fila-tentou", 0, () => markSendTried(nonce)) : 0,
  );

  ipcMain.handle("fila:podar", () => quiet("fila-podar", [] as QueuedSend[], () => pruneQueue()));

  ipcMain.handle("cache:tamanho", () =>
    quiet("tamanho", { messages: 0, channels: 0 }, cacheSize),
  );

  app.on("will-quit", () => quiet("fechar", undefined, closeCache));
}
