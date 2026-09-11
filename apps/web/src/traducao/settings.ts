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

export type Language = (typeof languages)[number];

export type Catalog = typeof ptBR;

export interface LanguageData {
  lng: Language;
  native: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

export const LANGUAGES: LanguageData[] = [
  {
    lng: "pt-BR",
    native: "Português do Brasil",
    name: "Português do Brasil",
    flag: "🇧🇷",
  },
  { lng: "ar", native: "العربية", name: "Árabe", flag: "🇸🇦", rtl: true },
  { lng: "bg", native: "Български", name: "Búlgaro", flag: "🇧🇬" },
  { lng: "cs", native: "Čeština", name: "Tcheco", flag: "🇨🇿" },
  { lng: "da", native: "Dansk", name: "Dinamarquês", flag: "🇩🇰" },
  { lng: "de", native: "Deutsch", name: "Alemão", flag: "🇩🇪" },
  { lng: "el", native: "Ελληνικά", name: "Grego", flag: "🇬🇷" },
  {
    lng: "en-GB",
    native: "English (UK)",
    name: "Inglês britânico",
    flag: "🇬🇧",
  },
  { lng: "en-US", native: "English (US)", name: "Inglês", flag: "🇺🇸" },
  {
    lng: "es-419",
    native: "Español de Latinoamérica",
    name: "Espanhol latino",
    flag: "🇲🇽",
  },
  {
    lng: "es-ES",
    native: "Español de España",
    name: "Espanhol",
    flag: "🇪🇸",
  },
  { lng: "fi", native: "Suomi", name: "Finlandês", flag: "🇫🇮" },
  { lng: "fr", native: "Français", name: "Francês", flag: "🇫🇷" },
  { lng: "he", native: "עברית", name: "Hebraico", flag: "🇮🇱", rtl: true },
  { lng: "hi", native: "हिन्दी", name: "Híndi", flag: "🇮🇳" },
  { lng: "hr", native: "Hrvatski", name: "Croata", flag: "🇭🇷" },
  { lng: "hu", native: "Magyar", name: "Húngaro", flag: "🇭🇺" },
  { lng: "id", native: "Bahasa Indonesia", name: "Indonésio", flag: "🇮🇩" },
  { lng: "it", native: "Italiano", name: "Italiano", flag: "🇮🇹" },
  { lng: "ja", native: "日本語", name: "Japonês", flag: "🇯🇵" },
  { lng: "ko", native: "한국어", name: "Coreano", flag: "🇰🇷" },
  { lng: "lt", native: "Lietuvių", name: "Lituano", flag: "🇱🇹" },
  { lng: "nl", native: "Nederlands", name: "Holandês", flag: "🇳🇱" },
  { lng: "no", native: "Norsk", name: "Norueguês", flag: "🇳🇴" },
  { lng: "pl", native: "Polski", name: "Polonês", flag: "🇵🇱" },
  { lng: "ro", native: "Română", name: "Romeno", flag: "🇷🇴" },
  { lng: "ru", native: "Русский", name: "Russo", flag: "🇷🇺" },
  { lng: "sv-SE", native: "Svenska", name: "Sueco", flag: "🇸🇪" },
  { lng: "th", native: "ไทย", name: "Tailandês", flag: "🇹🇭" },
  { lng: "tr", native: "Türkçe", name: "Turco", flag: "🇹🇷" },
  { lng: "uk", native: "Українська", name: "Ucraniano", flag: "🇺🇦" },
  { lng: "vi", native: "Tiếng Việt", name: "Vietnamita", flag: "🇻🇳" },
  {
    lng: "zh-CN",
    native: "简体中文",
    name: "Chinês simplificado",
    flag: "🇨🇳",
  },
  {
    lng: "zh-TW",
    native: "繁體中文",
    name: "Chinês tradicional",
    flag: "🇹🇼",
  },
];

export const isRtl = (lng: Language): boolean =>
  LANGUAGES.find((language) => language.lng === lng)?.rtl === true;

export { ptBR };

export const languageFolder = (lng: string) => lng.toLowerCase();
