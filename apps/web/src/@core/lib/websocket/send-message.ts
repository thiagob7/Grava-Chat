import type { ClientEventPayload } from "@gravae/shared";

import { emit } from ".";

export const sendMessage = (payload: ClientEventPayload<"message:send">) =>
  emit("message:send", payload);
