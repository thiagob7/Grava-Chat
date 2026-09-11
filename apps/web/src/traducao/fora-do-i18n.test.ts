import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { i18nTextsOutside } from "./fora-do-i18n";

const root = dirname(fileURLToPath(import.meta.url));
const listFile = join(root, "fora-do-i18n.pendentes.json");

const pending = new Set(
  JSON.parse(readFileSync(listFile, "utf8")) as string[],
);

const matches = i18nTextsOutside(join(root, ".."));
const key = ({ file, text }: { file: string; text: string }) =>
  `${file} :: ${text}`;

if (process.env.UPDATE_PENDING) {
  const list = matches.map(key);
  writeFileSync(listFile, `${JSON.stringify(list, null, 2)}\n`);
  pending.clear();
  for (const item of list) pending.add(item);
}

describe("texto fora do i18n", () => {
  it("não deixa entrar texto novo em português no código", () => {
    const fresh = matches.map(key).filter((c) => !pending.has(c));

    expect(fresh).toEqual([]);
  });

  it("não deixa a lista de pendências guardar o que já foi resolvido", () => {
    const seen = new Set(matches.map(key));
    const leftover = [...pending].filter((c) => !seen.has(c));

    expect(leftover).toEqual([]);
  });
});
