import type { ServerToClientEvents } from "@gravae/shared";

import { socket } from ".";

export type PresenceSelfFunc = ServerToClientEvents["presence:self"];

/**
 * O eco da SUA presença, num evento separado do broadcast.
 *
 * Os seus sockets também estão nas salas dos servidores, então o
 * `presence:changed` do broadcast chega dizendo que VOCÊ está offline quando
 * fica invisível. Sem este evento, o app mostraria "offline" pra quem acabou de
 * escolher "invisível" — e não há como o servidor distinguir os dois casos do
 * outro lado.
 */
export const onPresenceSelf = (func: PresenceSelfFunc) => {
  socket()?.on("presence:self", func);
};

export const offPresenceSelf = (func?: PresenceSelfFunc) => {
  socket()?.off("presence:self", func);
};
