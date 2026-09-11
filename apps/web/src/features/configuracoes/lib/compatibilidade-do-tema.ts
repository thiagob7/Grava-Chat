import { PLACES } from "~/lib/compat-de-tema";

export interface Compatibility {
  matches: string[];
  missing: string[];
}

const namesHave = () => {
  const all = new Set<string>();

  for (const place of Object.values(PLACES)) {
    for (const cssClass of place.classes as readonly string[]) all.add(cssClass);
    if ("flx" in place) all.add(place.flx);
  }

  return all;
};

export function checkCompatibility(css: string): Compatibility {
  const our = namesHave();

  const requests = new Set<string>();

  for (const match of css.matchAll(/\[class\*=["']([^"']+)["']\]/g)) {
    if (match[1]) requests.add(match[1]);
  }

  for (const match of css.matchAll(/\[data-flx=["']([^"']+)["']\]/g)) {
    if (match[1]) requests.add(match[1]);
  }

  const matches: string[] = [];
  const missing: string[] = [];

  for (const request of [...requests].sort()) {
    const have = [...our].some((our) => our.includes(request));

    (have ? matches : missing).push(request);
  }

  return { matches, missing };
}
