import { create } from "zustand";

interface ImportTheme {
  themeId: string | null;
  open: (themeId: string) => void;
  close: () => void;
}

export const useImportTheme = create<ImportTheme>((set) => ({
  themeId: null,
  open: (themeId) => set({ themeId }),
  close: () => set({ themeId: null }),
}));
