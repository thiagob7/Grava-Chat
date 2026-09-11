import { THEME_BRIDGE, namesDeclaredTheme } from "~/features/configuracoes/lib/ponte-de-tema";
import { TOKENS_DERIVED } from "~/features/configuracoes/lib/cores-mae";

export interface TokensCompatibility {
  translated: string[];
  inferred: string[];
  ignoredList: string[];
}

const usedByOwnTheme = (css: string, name: string) =>
  css.includes(`var(${name}`) || css.includes(`var( ${name}`);

export function checkTokens(css: string): TokensCompatibility {
  const declared = namesDeclaredTheme(css);

  const translated: string[] = [];
  const ignoredList: string[] = [];
  const destinations = new Set<string>();

  for (const name of [...declared].sort()) {
    const targets = THEME_BRIDGE[name];

    if (targets) {
      translated.push(name);
      for (const target of targets) destinations.add(target);
      continue;
    }

    if (!usedByOwnTheme(css, name)) ignoredList.push(name);
  }

  const inferred = [...TOKENS_DERIVED]
    .filter((token) => !destinations.has(token))
    .sort();

  return { translated, inferred, ignoredList };
}
