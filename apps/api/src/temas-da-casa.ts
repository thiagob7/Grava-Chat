import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { readThemeHeader } from "@gravae/shared";

function themesFolder(): string | null {
  for (const candidate of ["./temas/", "../temas/"]) {
    const path = fileURLToPath(new URL(candidate, import.meta.url));
    if (existsSync(path)) return path;
  }

  return null;
}

export interface HouseTheme {
  key: string;
  name: string;
  description: string;
  version: string;
  css: string;
}

export function readHouseThemes(): HouseTheme[] {
  const folder = themesFolder();
  if (!folder) return [];

  return readdirSync(folder)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => {
      const css = readFileSync(folder + file, "utf8");
      const header = readThemeHeader(css);

      return {
        key: file.replace(/\.css$/, ""),
        name: header.name ?? file,
        description: header.description ?? "",
        version: header.version ?? "",
        css,
      };
    });
}
