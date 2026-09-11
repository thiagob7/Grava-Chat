import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const root = dirname(fileURLToPath(import.meta.url));
const OUTSIDE = new Set(["traducao", "assets", "node_modules"]);

const FORGIVEN: { file: string; because: string }[] = [
  {
    file: "components/ui/color-picker.tsx",
    because: "é a roda de cor: os gradientes são o próprio seletor",
  },
  {
    file: "pages/presentation/auth/SignIn.tsx",
    because: "as cores do logotipo do Google são da marca deles",
  },
  {
    file: "features/servidor/components/server-settings/RoleEditor.tsx",
    because: "a paleta de cargo é dado que o servidor escolhe, não tema",
  },
  {
    file: "features/configuracoes/components/perfil/campos.tsx",
    because: "cor padrão de cargo, mesma razão",
  },
  {
    file: "features/configuracoes/components/AppearanceSection.tsx",
    because: "as miniaturas desenham cada tema base; são amostra, não interface",
  },
  {
    file: "components/Confete.tsx",
    because: "papel picado é enfeite de festa, não peça de interface",
  },
];

function files(folder: string, matches: string[] = []) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    if (OUTSIDE.has(item.name)) continue;

    const path = join(folder, item.name);

    if (item.isDirectory()) files(path, matches);
    else if (/\.tsx$/.test(item.name)) matches.push(path);
  }

  return matches;
}

const RAW =
  /\b(?:bg|text|border|ring|shadow|fill|stroke|from|to|via|divide|caret|accent|outline)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\[?[\d.]+\]?)?\b/g;

const LITERAL_CLASS = /\[[^\]]*(?:#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()[^\]]*\]/g;

describe("cor fora de token", () => {
  const forgiven = new Set(FORGIVEN.map((p) => p.file));

  const matches = files(root.replace(/\/lib$/, "")).flatMap((path) => {
    const short = relative(root.replace(/\/lib$/, ""), path).split("\\").join("/");
    if (forgiven.has(short)) return [];

    const text = readFileSync(path, "utf8");

    return [
      ...(text.match(RAW) ?? []),
      ...(text.match(LITERAL_CLASS) ?? []),
    ].map((match) => `${short}: ${match}`);
  });

  it("não existe classe de cor fora do nosso vocabulário", () => {
    expect(matches).toEqual([]);
  });

  it("toda exceção tem motivo escrito", () => {
    expect(FORGIVEN.filter((p) => p.because.trim().length < 20)).toEqual([]);
  });
});
