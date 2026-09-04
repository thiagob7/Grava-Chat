import { useTranslation as useTranslationOriginal } from "react-i18next";

import i18next from "./i18next";
import { ehRtl, fallbackLng, languages, type Idioma } from "./settings";

export const useTranslation = useTranslationOriginal;

export function idiomaAtual(): Idioma {
  const bruto = i18next.resolvedLanguage ?? i18next.language ?? fallbackLng;

  return (languages as readonly string[]).includes(bruto)
    ? (bruto as Idioma)
    : fallbackLng;
}

export async function trocarIdioma(idioma: Idioma): Promise<void> {
  await i18next.changeLanguage(idioma);

  document.documentElement.lang = idioma;

  if (ehRtl(idioma)) document.documentElement.dir = "rtl";
  else document.documentElement.removeAttribute("dir");
}
