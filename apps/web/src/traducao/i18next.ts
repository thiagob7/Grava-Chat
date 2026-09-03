import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import {
  defaultNS,
  fallbackLng,
  languages,
  resources,
  storageKey,
} from "./settings";

/*
  A ordem do detector importa, e é a mesma do backoffice.

  `localStorage` primeiro porque escolha explícita ganha de palpite: quem já
  disse qual idioma quer não deve ser sobrescrito pelo navegador na próxima
  abertura. `navigator` por último é o palpite, que só vale enquanto ninguém
  escolheu nada.

  `htmlTag` no meio cobre o caso do aplicativo, onde a janela pode nascer com o
  idioma do sistema carimbado no `<html>` antes do JavaScript rodar.
*/
void i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(resourcesToBackend(resources))
  .init({
    supportedLngs: languages,
    fallbackLng,
    fallbackNS: defaultNS,
    defaultNS,
    /// O React já escapa tudo o que interpola. Escapar de novo transformaria
    /// aspas e acentos em entidades no meio da frase.
    interpolation: { escapeValue: false },
    /*
      Sem Suspense: os recursos são objetos já empacotados, não requisições —
      não há espera para suspender. Com ele ligado, cada componente que traduz
      vira um limite de Suspense a mais por nada.
    */
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "htmlTag", "navigator"],
      lookupLocalStorage: storageKey,
      caches: ["localStorage"],
    },
  });

export default i18next;
