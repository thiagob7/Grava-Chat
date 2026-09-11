import { THEME_APPLIED } from "~/features/configuracoes/lib/evento-de-tema";

/*
  Instalado como app, o sistema pinta as barras dele com a `theme-color` da
  página. Ela era um valor fixo no `index.html`, quase preto, e aparecia como
  uma tarja embaixo do campo de escrever em qualquer tema que não fosse
  daquela cor.

  A tarja é justamente onde a página NÃO desenha, e o vizinho dela é o campo de
  escrever. Então a cor das barras é a dele, e acompanha a troca de tema.
*/
const FALLBACK = "#121214";

/*
  O valor cru do token pode ser `hsl(... calc(...))`, que a meta não aceita.
  Pintar numa sonda e ler de volta devolve sempre `rgb()`, já resolvido.
*/
const readColor = () => {
  const probe = document.createElement("span");
  probe.style.cssText = "position:absolute;width:0;height:0;visibility:hidden;pointer-events:none";
  document.body.appendChild(probe);

  try {
    for (const token of ["--color-composer", "--color-surface-1", "--color-surface-0"]) {
      probe.style.backgroundColor = "";
      probe.style.backgroundColor = `var(${token})`;

      const cor = getComputedStyle(probe).backgroundColor;
      if (cor && cor !== "rgba(0, 0, 0, 0)" && cor !== "transparent") return cor;
    }
  } catch {
  } finally {
    probe.remove();
  }

  return FALLBACK;
};

const write = (cor: string) => {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }

  if (meta.content !== cor) meta.content = cor;
};

export function followBarColor() {
  if (typeof window === "undefined") return;

  const apply = () => write(readColor());

  apply();
  window.addEventListener(THEME_APPLIED, apply);

  const scheme = window.matchMedia("(prefers-color-scheme: dark)");
  scheme.addEventListener("change", apply);

  const watcher = new MutationObserver(apply);
  watcher.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "style"],
  });
}
