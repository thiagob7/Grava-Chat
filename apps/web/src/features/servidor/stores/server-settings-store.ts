import { create } from "zustand";

import type { Section } from "~/features/servidor/components/server-settings/ServerSettingsModal";

interface ServerSettingsState {
  guildId: string | null;
  isOpen: boolean;
  section: Section | null;
  open: (guildId: string, section?: Section) => void;
  close: () => void;
}

export const useServerSettingsStore = create<ServerSettingsState>((set) => ({
  guildId: null,
  isOpen: false,
  section: null,
  open: (guildId, section) => set({ guildId, isOpen: true, section: section ?? null }),
  close: () => set({ isOpen: false }),
}));
