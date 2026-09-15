import type { GuildEmoji } from "@gravae/shared";

import { api } from "~/@core/lib/api";

const BATCH_MS = 20;
const MAX_PER_REQUEST = 50;

let pending = new Map<string, { resolve: (emoji: GuildEmoji | null) => void; reject: (error: unknown) => void }[]>();
let timer: ReturnType<typeof setTimeout> | null = null;

async function flush() {
  const batch = pending;
  pending = new Map();
  timer = null;

  const ids = [...batch.keys()];

  for (let i = 0; i < ids.length; i += MAX_PER_REQUEST) {
    const slice = ids.slice(i, i + MAX_PER_REQUEST);

    try {
      const { data } = await api.get<GuildEmoji[]>("/emojis", { params: { ids: slice.join(",") } });
      const byId = new Map(data.map((emoji) => [emoji.id, emoji]));
      for (const id of slice) batch.get(id)?.forEach((waiter) => waiter.resolve(byId.get(id) ?? null));
    } catch (error) {
      for (const id of slice) batch.get(id)?.forEach((waiter) => waiter.reject(error));
    }
  }
}

export function findEmojiById(id: string): Promise<GuildEmoji | null> {
  return new Promise((resolve, reject) => {
    pending.set(id, [...(pending.get(id) ?? []), { resolve, reject }]);
    timer ??= setTimeout(() => void flush(), BATCH_MS);
  });
}
