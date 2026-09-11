import { create } from "zustand";

import type { Section } from "~/features/configuracoes/components/UserSettingsModal";

interface SettingsStore {
  section: Section | null;
  initialSub: string | null;
  open: (section: Section, sub?: string) => void;
  initialConsumeSub: () => void;
  close: () => void;
}

export const useSettings = create<SettingsStore>((set) => ({
  section: null,
  initialSub: null,
  open: (section, sub) => set({ section, initialSub: sub ?? null }),
  initialConsumeSub: () => set({ initialSub: null }),
  close: () => set({ section: null, initialSub: null }),
}));
