/*
  Compila o CSS e falha se ele não compilar.

  Existe por causa de um bug que custou meio dia: dois `///` dentro de arquivos
  `.css`. CSS não tem comentário de linha — o PostCSS lê aquilo como declaração,
  tropeça no primeiro token e para com "Unknown word a". O dev server morria; o
  `vite build` passava.

  É essa a razão de o `yarn build` não servir de rede de segurança aqui: o
  caminho de build engole o erro, e quem paga é quem roda `yarn dev` depois. Este
  script usa o MESMO PostCSS do dev, então ele vê o que o dev vê.

  E o número da linha que ele mostra é o do ARQUIVO-FONTE. O erro do Vite aponta
  a posição depois de embutir o Tailwind gerado — na ocasião ele dizia linha
  6.309 num arquivo de 710, e foi isso que fez o problema parecer cache.
*/
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ENTRADA = join(AQUI, "..", "src", "styles", "index.css");

try {
  const css = await readFile(ENTRADA, "utf8");
  const { css: saida } = await postcss([tailwind()]).process(css, { from: ENTRADA });

  console.log(`css: ok — ${saida.split("\n").length} linhas geradas`);
} catch (erro) {
  console.error(`\n  O CSS não compila:\n\n  ${erro.message}\n`);

  /// O PostCSS sabe mostrar o trecho em volta do erro, com a linha marcada. É a
  /// diferença entre "conserte o CSS" e "conserte esta linha".
  if (typeof erro.showSourceCode === "function") console.error(erro.showSourceCode(false));

  process.exit(1);
}
