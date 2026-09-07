/*
  Os nós que faltavam para a nossa base ser um grafo, e não uma lista.

  O `tokens.css` já declarava 367 das 456 variáveis da raiz da referência — mas
  justamente as folhas: espaçamento, tamanho, medida de cartão. As 89 que
  faltavam são o miolo, e não faltavam por acaso: elas entram nas cadeias do
  `@theme` (`--color-surface-0: var(--background-primary, …)`), e uma sessão
  anterior tirou todas para não sombrear a cadeia.

  O efeito colateral disso é o que fazia "o mesmo tema ficar de outra cor": sem
  esses nós, cada cor nossa era um literal solto. Lá elas formam um grafo —
  `--accent-primary` é `var(--brand-primary)`, `--code-block-bg` é um
  `color-mix` de `--background-secondary-alt`, e 86 delas passam por
  `--saturation-factor`, que sozinho alimenta 88 variáveis. Um tema mexe num nó
  e repinta tudo que vem depois. Aqui mexia numa e mudava uma.

  Sombrear não é problema quando a declaração mora numa CAMADA: regra fora de
  camada vence regra em camada, não importa a especificidade — que é a mesma
  razão pela qual um tema importado vence as variantes do app. Então o grafo
  entra em `@layer variantes-do-app`, e continua valendo:

      grafo (:root, na camada)
        < variante do app (:root[data-tema=…], mesma camada, mais específico)
          < tema importado (fora de camada)

  Gerado, e não escrito à mão, porque a fonte é o `vocabulario-de-temas.json`:
  quando eles publicam build novo, `yarn vocabulario && yarn base-de-tema`
  atualiza os dois.

  Rodar:
    node scripts/base-de-tema.mjs           escreve o CSS
    node scripts/base-de-tema.mjs --check   falha se estiver velho
*/
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const VOCABULARIO = join(AQUI, "vocabulario-de-temas.json");
const TOKENS = join(AQUI, "..", "src", "styles", "tokens.css");
const SAIDA = join(AQUI, "..", "src", "styles", "base-de-tema.css");
/*
  O que EXISTE no app da referência hoje, em forma pequena o bastante para o
  navegador carregar: os 371 nomes de módulo e as 435 áreas de `data-flx`
  (`area.arquivo`). Serve para a chave "só o que existe lá hoje": um tema
  escrito para um build antigo mira nomes que já não existem lá, e no app deles
  essas regras estão mortas. Aqui a gente carrega os nomes antigos de propósito
  — é o que faz os temas funcionarem — mas quem quer ver o tema como ele fica
  LÁ precisa saber quais regras lá não pegam.
*/
const EXISTENTES = join(
  AQUI, "..", "src", "features", "configuracoes", "lib", "existe-na-referencia.json",
);

export function montarExistentes(vocabulario) {
  const modulos = [...new Set(vocabulario.classes.map((c) => c.split(".module__")[0]))].sort();
  const areas = [...new Set(vocabulario.flx.map((f) => f.split(".").slice(0, 2).join(".")))].sort();
  return `${JSON.stringify({ modulos, areas })}\n`;
}

/*
  Só o `:root` pelado. As variantes (`:root[data-tema=…]`) declaram de propósito
  por cima, e contá-las faria o gerador achar que o nó já existe.
*/
export function declaradasNaRaiz(css) {
  const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const nomes = new Set();

  for (const [, seletor, corpo] of semComentario.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (seletor.trim() !== ":root") continue;
    for (const [, nome] of corpo.matchAll(/(--[a-z0-9-]+)\s*:/g)) nomes.add(nome);
  }

  return nomes;
}

export function montar(variaveis, jaTemos) {
  const faltando = Object.keys(variaveis)
    .filter((nome) => !jaTemos.has(nome))
    .sort();

  const linhas = faltando.map((nome) => `    ${nome}: ${variaveis[nome].valor};`);

  return `/*
  GERADO por scripts/base-de-tema.mjs — não edite à mão.

  Os ${faltando.length} nós do grafo de cores da referência que o tokens.css não declara.
  O porquê da camada, e por que isto não sombreia a cadeia do @theme, está no
  cabeçalho do gerador.
*/
@layer variantes-do-app {
  :root {
${linhas.join("\n")}
  }
}
`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (!existsSync(VOCABULARIO)) {
    console.error("\nfalta o vocabulario-de-temas.json. Rode: yarn vocabulario\n");
    process.exit(1);
  }

  const vocabulario = JSON.parse(readFileSync(VOCABULARIO, "utf8"));
  const css = montar(vocabulario.variaveis, declaradasNaRaiz(readFileSync(TOKENS, "utf8")));
  const existentes = montarExistentes(vocabulario);

  if (process.argv[2] === "--check") {
    const atual = existsSync(SAIDA) ? readFileSync(SAIDA, "utf8") : "";

    const atualExistentes = existsSync(EXISTENTES) ? readFileSync(EXISTENTES, "utf8") : "";

    if (atual !== css || atualExistentes !== existentes) {
      console.error("\nbase-de-tema.css ou existe-na-referencia.json está fora de dia. Rode: yarn base-de-tema\n");
      process.exit(1);
    }

    const quantos = css.match(/^ {4}--/gm)?.length ?? 0;
    console.log(`base da referência em dia — ${quantos} nós`);
  } else {
    writeFileSync(SAIDA, css);
    writeFileSync(EXISTENTES, existentes);
    const quantos = css.match(/^ {4}--/gm)?.length ?? 0;
    console.log(`${quantos} nós em ${relative(process.cwd(), SAIDA)}`);
  }
}
