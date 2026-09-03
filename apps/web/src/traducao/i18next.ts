import i18next from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next/initReactI18next";

import { ptBR } from "./pt-br";
import {
  defaultNS,
  fallbackLng,
  languages,
  pastaDoIdioma,
  storageKey,
} from "./settings";

/*
  Cada idioma chega por `import()`, e não todos empacotados juntos.

  Com três idiomas, empacotar tudo era mais simples e igual de rápido. Com
  trinta e quatro, é mandar trinta e três catálogos para quem vai ler um — e
  o custo cresce junto com a tradução, que hoje tem sessenta e cinco textos e
  vai ter mil e trezentos. O Vite lê este padrão e recorta um arquivo por
  pasta sozinho.

  O português é a exceção: ele vem junto, sempre, porque é o `fallbackLng`.
  Carregá-lo por rede significaria uma tela sem texto nenhum no primeiro
  instante — e é justamente ele que preenche o que os outros ainda não têm.
*/
const carregar = resourcesToBackend(async (lng: string) => {
  if (lng === fallbackLng) return ptBR;

  const modulo = (await import(`./${pastaDoIdioma(lng)}/index.ts`)) as {
    default: typeof ptBR;
  };
  return modulo.default;
});

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
  .use(carregar)
  .init({
    supportedLngs: languages,
    fallbackLng,
    fallbackNS: defaultNS,
    defaultNS,
    ns: [defaultNS],
    /*
      O português entra pronto, antes de qualquer rede.

      Sem isto, a primeira pintura de quem está em português esperaria uma
      promessa resolver — e o `useSuspense: false` abaixo faz essa espera
      aparecer como tela sem texto, não como carregando.
    */
    resources: { [fallbackLng]: { [defaultNS]: ptBR } },
    /// O React já escapa tudo o que interpola. Escapar de novo transformaria
    /// aspas e acentos em entidades no meio da frase.
    interpolation: { escapeValue: false },
    /*
      Sem Suspense: cada componente que traduz viraria um limite de Suspense a
      mais. Quem troca de idioma vê o texto antigo por um instante e depois o
      novo, que é melhor que a tela inteira sumir e voltar.
    */
    react: { useSuspense: false },
    detection: {
      order: ["localStorage", "htmlTag", "navigator"],
      lookupLocalStorage: storageKey,
      caches: ["localStorage"],
    },
  });

export default i18next;
