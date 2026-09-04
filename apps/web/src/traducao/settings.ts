import { ptBR } from "./pt-br";

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

export type Catalogo = typeof ptBR;

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

export { ptBR };

export const pastaDoIdioma = (lng: string) => lng.toLowerCase();
