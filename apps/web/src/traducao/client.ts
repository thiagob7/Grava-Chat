import { useTranslation as useTranslationOriginal } from "react-i18next";

import i18next from "./i18next";
import { ehRtl, fallbackLng, languages, type Idioma } from "./settings";

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

  /*
    A direção da escrita, junto com o idioma.

    Árabe e hebraico se escrevem da direita para a esquerda, e `dir="rtl"` no
    documento é o que espelha o layout inteiro — margens, ordem dos ícones,
    de que lado a barra de rolagem nasce. Trocar só o texto daria as palavras
    certas num desenho invertido, que é pior que não ter o idioma.

    É apagado em vez de virar "ltr" nos outros: `ltr` é o padrão do HTML, e um
    atributo que repete o padrão só serve para alguém achar que ele faz algo.
  */
  if (ehRtl(idioma)) document.documentElement.dir = "rtl";
  else document.documentElement.removeAttribute("dir");
}
