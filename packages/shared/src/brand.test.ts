import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { APP_ORIGINS } from "./origens.js";
import { APP_URL, BRAND_NAME, LEGACY_APP_URL } from "./brand.js";

const ROOT = path.resolve(import.meta.dirname, "../../..");
const LEGACY = /Grava[êe] Chat|Gravaê|GRAVAÊ/;

const ALLOWED: Record<string, string> = {
  "packages/shared/src/brand.test.ts": "esta própria trava, que precisa do nome antigo para procurá-lo",
  "apps/api/src/services/legacy-brand.ts": "os nomes antigos que a migração da casa procura para renomear",
  "apps/desktop/package.json": "o productName batiza a pasta de dados; trocar esvazia o cache de quem já usa",
  "apps/desktop/src/main/atualizacao-mac.ts": "o pacote instalado se chama Gravae Chat.app, e o atualizador que já está nas máquinas procura esse nome",
  "apps/desktop/electron-builder.yml": "o comentário que explica por que acento no nome derruba o app no Mac",
};

const SCANNED = ["apps", "packages", "exemplos", "infra", ".github", "README.md"];

const BINARY = /\.(png|jpe?g|gif|webp|ico|icns|woff2?|ttf|otf|mp3|ogg|wav|zip)$/i;

describe("a marca", () => {
  it("o nome antigo não volta a aparecer no código", () => {
    const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", ...SCANNED], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((file) => file && !BINARY.test(file) && !(file in ALLOWED));

    const found = files.filter((file) => {
      try {
        return LEGACY.test(readFileSync(path.join(ROOT, file), "utf8"));
      } catch {
        return false;
      }
    });

    expect(found).toEqual([]);
  });

  it("o endereço novo do app vem antes do antigo, que continua reconhecido", () => {
    expect(APP_ORIGINS[0]).toBe(APP_URL);
    expect(APP_ORIGINS).toContain(LEGACY_APP_URL);
  });

  it("o nome é um só", () => {
    expect(BRAND_NAME).toBe("Ravox Chat");
  });
});
