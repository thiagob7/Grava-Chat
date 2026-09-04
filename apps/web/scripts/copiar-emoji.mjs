/*
  Copia os SVGs do Twemoji do `node_modules` para `public/emoji/`.

  Por que copiar em vez de importar: são 3.723 arquivos. Importados um a um pelo
  Vite, cada um vira um módulo no grafo e um `fetch` com hash no nome — o build
  demora e o navegador não consegue cachear a pasta inteira de uma vez. Em
  `public/` eles são servidos como estão, com o nome do codepoint, que é
  justamente o que o `lib/twemoji.ts` precisa para montar a URL sem tabela
  nenhuma no meio.

  A pasta não entra no git (veja o `.gitignore`): ela é derivada da dependência,
  e versioná-la seria guardar 16 MB que o `yarn install` já traz.

  Roda no `predev` e no `prebuild`, e sai na hora se já estiver tudo lá — o
  atraso na subida do dev server é o preço de um `readdir`.
*/
import { cp, mkdir, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = join(AQUI, "..", "public", "emoji");

/*
  Quem acha o pacote é o Node, não um caminho escrito à mão.

  Isto é workspace do yarn, e a dependência é ICADA para o `node_modules` da
  raiz — `apps/web/node_modules/@twemoji` não existe. Resolver um arquivo
  conhecido e pegar a pasta dele funciona esteja o pacote onde estiver: aqui ou
  na máquina de build da Vercel.
*/
const resolver = createRequire(import.meta.url);
let ORIGEM = "";
try {
  ORIGEM = dirname(resolver.resolve("@twemoji/svg/1f600.svg"));
} catch {
  /* segue com ORIGEM vazia: o aviso logo abaixo explica o que fazer */
}

async function quantos(pasta) {
  try {
    return (await readdir(pasta)).length;
  } catch {
    return 0;
  }
}

const naOrigem = ORIGEM ? await quantos(ORIGEM) : 0;

if (!naOrigem) {
  /*
    Sem os arquivos não dá pra seguir: o app renderizaria `<img>` quebrado em
    cada emoji. Falhar aqui é o que transforma um `yarn install` incompleto num
    erro que se lê, em vez de numa tela cheia de ícones de imagem partida.
  */
  console.error(
    "\n  Não achei o @twemoji/svg em node_modules. Rode `yarn install` antes.\n",
  );
  process.exit(1);
}

/*
  `>=` e não `===`: o NOTICE abaixo mora no destino e não existe na origem, então
  a contagem nunca bate exatamente. Com `===`, a cópia dos 16 MB rodaria a cada
  `yarn dev`.
*/
if ((await quantos(DESTINO)) >= naOrigem) {
  console.log(`emoji: ${naOrigem} arquivos já em public/emoji`);
  process.exit(0);
}

await mkdir(DESTINO, { recursive: true });
await cp(ORIGEM, DESTINO, { recursive: true });

/*
  O aviso de licença viaja COM os arquivos.

  A pasta é derivada e fica fora do git, então quem topa com ela — num servidor,
  num build, num zip do `dist` — não tem como saber de onde os SVGs vieram nem
  sob que licença. A referência faz o mesmo: o `NOTICE.md` dela mora dentro do
  diretório de emoji, não só no índice de licenças.
*/
await writeFile(
  join(DESTINO, "NOTICE.md"),
  [
    "# Emoji — Twemoji",
    "",
    "Estes SVGs são gráficos do Twemoji (https://github.com/jdecked/twemoji),",
    "licenciados sob CC-BY-4.0. Copyright © Twitter, Inc. e outros colaboradores.",
    "",
    "Atribuição completa e texto da licença: `/licencas/twemoji-NOTICE.md`.",
    "",
    "Pasta gerada por `apps/web/scripts/copiar-emoji.mjs` — não edite à mão.",
    "",
  ].join("\n"),
);

console.log(`emoji: ${naOrigem} arquivos copiados para public/emoji`);
