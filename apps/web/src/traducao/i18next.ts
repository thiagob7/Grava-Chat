import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { ptBR } from "./pt-br";
import {
  defaultNS,
  fallbackLng,
  languages,
  languageFolder,
  storageKey,
} from "./settings";

const load = resourcesToBackend(async (lng: string) => {
  if (lng === fallbackLng) return ptBR;

  const modulo = (await import(`./${languageFolder(lng)}/index.ts`)) as {
    default: typeof ptBR;
  };
  return modulo.default;
});

void i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(load)
  .init({
    supportedLngs: languages,
    fallbackLng,
    fallbackNS: defaultNS,
    defaultNS,
    ns: [defaultNS],
    resources: { [fallbackLng]: { [defaultNS]: ptBR } },
    partialBundledLanguages: true,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "htmlTag", "navigator"],
      lookupLocalStorage: storageKey,
      caches: ["localStorage"],
    },
  });

export default i18next;
