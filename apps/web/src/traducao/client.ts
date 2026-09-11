import { useTranslation as useTranslationOriginal } from "react-i18next";

import i18next from "./i18next";
import { isRtl, fallbackLng, languages, type Language } from "./settings";

export const useTranslation = useTranslationOriginal;

export function currentLanguage(): Language {
  const raw = i18next.resolvedLanguage ?? i18next.language ?? fallbackLng;

  return (languages as readonly string[]).includes(raw)
    ? (raw as Language)
    : fallbackLng;
}

export async function swapLanguage(language: Language): Promise<void> {
  await i18next.changeLanguage(language);

  document.documentElement.lang = language;

  if (isRtl(language)) document.documentElement.dir = "rtl";
  else document.documentElement.removeAttribute("dir");
}
