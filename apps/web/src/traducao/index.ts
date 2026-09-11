import "./i18next";

export { useTranslation, currentLanguage, swapLanguage } from "./client";
export {
  LANGUAGES,
  isRtl,
  fallbackLng,
  languages,
  type Language,
} from "./settings";
export { default as i18next } from "./i18next";
