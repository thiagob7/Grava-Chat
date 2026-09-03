import { useTranslation as useTranslationOriginal } from "react-i18next";

import i18next from "./i18next";
import { fallbackLng, languages, type Idioma } from "./settings";

export const useTranslation = useTranslationOriginal;

/// O idioma de agora, sempre um dos que existem. O detector pode devolver
/// `pt` ou `pt-PT` a partir do navegador, e nenhum dos dois está na lista.
export function idiomaAtual(): Idioma {
  const bruto = i18next.resolvedLanguage ?? i18next.language ?? fallbackLng;

  return (languages as readonly string[]).includes(bruto)
    ? (bruto as Idioma)
    : fallbackLng;
}

export async function trocarIdioma(idioma: Idioma): Promise<void> {
  await i18next.changeLanguage(idioma);

  /*
    O `lang` do documento não é enfeite.

    É por ele que o leitor de tela escolhe a pronúncia, que o navegador escolhe
    a hifenização e que o corretor ortográfico escolhe o dicionário. Trocar o
    texto e deixar o `lang` em português faz um leitor de tela ler inglês com
    sotaque português — o tipo de coisa que só quem depende dele percebe.
  */
  document.documentElement.lang = idioma;
}
