export const LEGACY_BRAND = "Gravaê";

export const LEGACY_HOUSE_USERNAME = "gravae";

export const LEGACY_SERVER_NAMES = {
  themes: "Gravaê Temas",
  developers: "Gravaê Developers",
  house: "Gravaê HQ",
} as const;

export const LEGACY_CHANNEL_NAMES: Record<string, string> = {
  "gravae-developers": "ravox-developers",
  "gravae-temas": "ravox-temas",
};

export const withoutLegacyBrand = (text: string, brand: string) => text.replaceAll(LEGACY_BRAND, brand);
