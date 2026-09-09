import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const raiz = dirname(fileURLToPath(import.meta.url));
const FORA = new Set(["traducao", "assets", "node_modules"]);

const PERDOADOS: { arquivo: string; porque: string }[] = [
  {
    arquivo: "components/ui/color-picker.tsx",
    porque: "é a roda de cor: os gradientes são o próprio seletor",
  },
  {
    arquivo: "pages/presentation/auth/SignIn.tsx",
    porque: "as cores do logotipo do Google são da marca deles",
  },
  {
    arquivo: "features/servidor/components/server-settings/RoleEditor.tsx",
    porque: "a paleta de cargo é dado que o servidor escolhe, não tema",
  },
  {
    arquivo: "features/configuracoes/components/perfil/campos.tsx",
    porque: "cor padrão de cargo, mesma razão",
  },
  {
    arquivo: "features/configuracoes/components/AppearanceSection.tsx",
    porque: "as miniaturas desenham cada tema base; são amostra, não interface",
  },
  {
    arquivo: "features/servidor/components/EventsModal.tsx",
    porque:
      "a prancheta atrás da ilustração casa com o borrão do próprio desenho (#ebf3fa); é cor da arte, não do tema, e um token deixaria o tema descolar dela",
  },
];

function arquivos(pasta: string, achados: string[] = []) {
  for (const item of readdirSync(pasta, { withFileTypes: true })) {
    if (FORA.has(item.name)) continue;

    const caminho = join(pasta, item.name);

    if (item.isDirectory()) arquivos(caminho, achados);
    else if (/\.tsx$/.test(item.name)) achados.push(caminho);
  }

  return achados;
}

const CRUA =
  /\b(?:bg|text|border|ring|shadow|fill|stroke|from|to|via|divide|caret|accent|outline)-(?:white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)(?:-\d{2,3})?(?:\/\[?[\d.]+\]?)?\b/g;

const LITERAL_NA_CLASSE = /\[[^\]]*(?:#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\()[^\]]*\]/g;

describe("cor fora de token", () => {
  const perdoados = new Set(PERDOADOS.map((p) => p.arquivo));

  const achados = arquivos(raiz.replace(/\/lib$/, "")).flatMap((caminho) => {
    const curto = relative(raiz.replace(/\/lib$/, ""), caminho).split("\\").join("/");
    if (perdoados.has(curto)) return [];

    const texto = readFileSync(caminho, "utf8");

    return [
      ...(texto.match(CRUA) ?? []),
      ...(texto.match(LITERAL_NA_CLASSE) ?? []),
    ].map((achado) => `${curto}: ${achado}`);
  });

  it("não existe classe de cor fora do nosso vocabulário", () => {
    expect(achados).toEqual([]);
  });

  it("toda exceção tem motivo escrito", () => {
    expect(PERDOADOS.filter((p) => p.porque.trim().length < 20)).toEqual([]);
  });
});
