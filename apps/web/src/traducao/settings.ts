import { ptBR } from "./pt-br";

/**
 * Os idiomas, e qual deles é a origem.
 *
 * A lista é a mesma da referência — trinta e quatro. Adotá-la inteira em vez de
 * escolher três significa que a comparação tela a tela continua valendo: se
 * alguém abrir o app dele em tcheco e o nosso em tcheco, a pergunta é se a
 * tradução está boa, não se o idioma existe.
 *
 * `pt-BR` é o padrão E a origem, e essa é a diferença em relação a ela. A
 * referência tem inglês na origem porque o produto dela foi escrito em inglês.
 * Este foi escrito e pensado em português: o texto que está no código É o texto
 * final, não uma chave à espera de tradução.
 */
export const fallbackLng = "pt-BR";

export const languages = [
  fallbackLng,
  "ar",
  "bg",
  "cs",
  "da",
  "de",
  "el",
  "en-GB",
  "en-US",
  "es-419",
  "es-ES",
  "fi",
  "fr",
  "he",
  "hi",
  "hr",
  "hu",
  "id",
  "it",
  "ja",
  "ko",
  "lt",
  "nl",
  "no",
  "pl",
  "ro",
  "ru",
  "sv-SE",
  "th",
  "tr",
  "uk",
  "vi",
  "zh-CN",
  "zh-TW",
] as const;

export const defaultNS = "traducao";
export const storageKey = "gravae:idioma";

export type Idioma = (typeof languages)[number];

/// O molde de qualquer catálogo. Ver `resources` abaixo para o porquê.
export type Catalogo = typeof ptBR;

/**
 * Como cada idioma se apresenta na lista.
 *
 * `nativo` primeiro e `nome` depois, e não o contrário: quem procura o próprio
 * idioma numa lista de trinta e quatro procura pela palavra que ELE usa.
 * "Español" acha quem fala espanhol; "Espanhol" acha quem já está lendo em
 * português — e quem já está lendo em português não precisa desta tela.
 *
 * `rtl` marca os que se escrevem da direita para a esquerda. Sem ele, ligar
 * árabe daria o texto certo num layout espelhado ao contrário, que é pior que
 * não ter o idioma.
 */
export interface DadosDoIdioma {
  lng: Idioma;
  nativo: string;
  nome: string;
  bandeira: string;
  rtl?: boolean;
}

export const IDIOMAS: DadosDoIdioma[] = [
  {
    lng: "pt-BR",
    nativo: "Português do Brasil",
    nome: "Português do Brasil",
    bandeira: "🇧🇷",
  },
  { lng: "ar", nativo: "العربية", nome: "Árabe", bandeira: "🇸🇦", rtl: true },
  { lng: "bg", nativo: "Български", nome: "Búlgaro", bandeira: "🇧🇬" },
  { lng: "cs", nativo: "Čeština", nome: "Tcheco", bandeira: "🇨🇿" },
  { lng: "da", nativo: "Dansk", nome: "Dinamarquês", bandeira: "🇩🇰" },
  { lng: "de", nativo: "Deutsch", nome: "Alemão", bandeira: "🇩🇪" },
  { lng: "el", nativo: "Ελληνικά", nome: "Grego", bandeira: "🇬🇷" },
  {
    lng: "en-GB",
    nativo: "English (UK)",
    nome: "Inglês britânico",
    bandeira: "🇬🇧",
  },
  { lng: "en-US", nativo: "English (US)", nome: "Inglês", bandeira: "🇺🇸" },
  {
    lng: "es-419",
    nativo: "Español de Latinoamérica",
    nome: "Espanhol latino",
    bandeira: "🇲🇽",
  },
  {
    lng: "es-ES",
    nativo: "Español de España",
    nome: "Espanhol",
    bandeira: "🇪🇸",
  },
  { lng: "fi", nativo: "Suomi", nome: "Finlandês", bandeira: "🇫🇮" },
  { lng: "fr", nativo: "Français", nome: "Francês", bandeira: "🇫🇷" },
  { lng: "he", nativo: "עברית", nome: "Hebraico", bandeira: "🇮🇱", rtl: true },
  { lng: "hi", nativo: "हिन्दी", nome: "Híndi", bandeira: "🇮🇳" },
  { lng: "hr", nativo: "Hrvatski", nome: "Croata", bandeira: "🇭🇷" },
  { lng: "hu", nativo: "Magyar", nome: "Húngaro", bandeira: "🇭🇺" },
  { lng: "id", nativo: "Bahasa Indonesia", nome: "Indonésio", bandeira: "🇮🇩" },
  { lng: "it", nativo: "Italiano", nome: "Italiano", bandeira: "🇮🇹" },
  { lng: "ja", nativo: "日本語", nome: "Japonês", bandeira: "🇯🇵" },
  { lng: "ko", nativo: "한국어", nome: "Coreano", bandeira: "🇰🇷" },
  { lng: "lt", nativo: "Lietuvių", nome: "Lituano", bandeira: "🇱🇹" },
  { lng: "nl", nativo: "Nederlands", nome: "Holandês", bandeira: "🇳🇱" },
  { lng: "no", nativo: "Norsk", nome: "Norueguês", bandeira: "🇳🇴" },
  { lng: "pl", nativo: "Polski", nome: "Polonês", bandeira: "🇵🇱" },
  { lng: "ro", nativo: "Română", nome: "Romeno", bandeira: "🇷🇴" },
  { lng: "ru", nativo: "Русский", nome: "Russo", bandeira: "🇷🇺" },
  { lng: "sv-SE", nativo: "Svenska", nome: "Sueco", bandeira: "🇸🇪" },
  { lng: "th", nativo: "ไทย", nome: "Tailandês", bandeira: "🇹🇭" },
  { lng: "tr", nativo: "Türkçe", nome: "Turco", bandeira: "🇹🇷" },
  { lng: "uk", nativo: "Українська", nome: "Ucraniano", bandeira: "🇺🇦" },
  { lng: "vi", nativo: "Tiếng Việt", nome: "Vietnamita", bandeira: "🇻🇳" },
  {
    lng: "zh-CN",
    nativo: "简体中文",
    nome: "Chinês simplificado",
    bandeira: "🇨🇳",
  },
  {
    lng: "zh-TW",
    nativo: "繁體中文",
    nome: "Chinês tradicional",
    bandeira: "🇹🇼",
  },
];

export const ehRtl = (lng: Idioma): boolean =>
  IDIOMAS.find((idioma) => idioma.lng === lng)?.rtl === true;

/*
  `typeof ptBR` como molde de todos os outros.

  É o que faz o TypeScript reclamar quando alguém acrescenta uma chave no
  português e esquece dos outros trinta e três: o catálogo incompleto deixa de
  encaixar no molde e o build para. Sem isso a chave faltando só apareceria em
  produção, como o nome cru da chave no meio da tela — e só para quem estivesse
  usando aquele idioma.

  Por isso os catálogos NÃO usam `as const`: com literais, o molde exigiria que
  o inglês dissesse "Minha conta". O tipo passaria a checar o TEXTO em vez do
  formato, que é o contrário do que se quer aqui.
*/
export { ptBR };

/// A pasta de cada idioma é o código em minúsculas — `pt-BR` mora em `pt-br`.
/// Uma regra só, sem mapa: mapa de trinta e quatro linhas seria mais uma lista
/// para desencontrar da realidade.
export const pastaDoIdioma = (lng: string) => lng.toLowerCase();
