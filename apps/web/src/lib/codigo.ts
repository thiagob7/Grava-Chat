/**
 * Reparte o texto de uma mensagem em código e não-código.
 *
 * Só isso — quem desenha é o `MessageContent`. Aqui fica a parte que dá pra
 * testar sem navegador: onde a cerca começa, onde acaba, e o que sobra.
 */

/// ```lingua ... ``` e `codigo`. A cerca engole a quebra de linha logo depois
/// da lingua pra que ```json\n{ } não comece o bloco com uma linha vazia.
const CERCA = /```([^\n`]*)\n?([\s\S]*?)```/g;
/// Pede pelo menos um caractere que não seja espaço: sem isso o par do meio
/// de "``` ```" casaria, e uma cerca vazia viraria uma pílula com um espaço
/// dentro.
const EM_LINHA = /`([^`\n]*[^\s`][^`\n]*)`/g;

export type Pedaco =
  | { tipo: "texto"; texto: string }
  | { tipo: "linha"; codigo: string }
  | { tipo: "bloco"; codigo: string; lingua: string | null };

export function partirEmCodigo(conteudo: string): Pedaco[] {
  const pedacos: Pedaco[] = [];
  let ultimo = 0;

  /*
    A cerca vem antes do resto. Um `https://` ou um `:emoji:` dentro dela é
    código, não link nem figurinha — se o texto passasse pelo enriquecedor
    primeiro, o bloco viraria uma sopa de pílulas azuis.
  */
  for (const casamento of conteudo.matchAll(CERCA)) {
    if (casamento.index === undefined) continue;

    const [inteiro, informe, corpo] = casamento;
    const codigo = (corpo ?? "").replace(/\n$/, "");

    /// ``` ``` vazia não é bloco: é alguém escrevendo crase.
    if (!codigo.trim()) continue;

    if (casamento.index > ultimo) {
      pedacos.push(...emLinha(conteudo.slice(ultimo, casamento.index)));
    }

    pedacos.push({ tipo: "bloco", codigo, lingua: primeiraPalavra(informe) });
    ultimo = casamento.index + inteiro.length;
  }

  if (ultimo < conteudo.length) pedacos.push(...emLinha(conteudo.slice(ultimo)));

  return pedacos;
}

function emLinha(trecho: string): Pedaco[] {
  const pedacos: Pedaco[] = [];
  let ultimo = 0;

  for (const casamento of trecho.matchAll(EM_LINHA)) {
    if (casamento.index === undefined) continue;

    if (casamento.index > ultimo) {
      pedacos.push({ tipo: "texto", texto: trecho.slice(ultimo, casamento.index) });
    }

    pedacos.push({ tipo: "linha", codigo: casamento[1] ?? "" });
    ultimo = casamento.index + casamento[0].length;
  }

  if (ultimo < trecho.length) pedacos.push({ tipo: "texto", texto: trecho.slice(ultimo) });

  return pedacos;
}

/// O informe é livre — `json`, `ts twoslash`, `sh # instala`. O rótulo usa a
/// primeira palavra; o resto é recado de quem escreveu.
function primeiraPalavra(informe: string | undefined): string | null {
  return (informe ?? "").trim().split(/\s+/)[0] || null;
}

/**
 * Como a linguagem aparece no cabeçalho. A cerca aceita o que a pessoa
 * digitar — `js`, `JS`, `javascript` —, e sem uma tabela cada apelido viraria
 * um rótulo diferente pro mesmo bloco. O que não está aqui aparece como veio,
 * só com a primeira letra maiúscula: é melhor mostrar "Zig" do que engolir.
 */
const LINGUAS: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cpp: "C++",
  cs: "C#",
  css: "CSS",
  diff: "Diff",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  kt: "Kotlin",
  markdown: "Markdown",
  md: "Markdown",
  php: "PHP",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  rs: "Rust",
  rust: "Rust",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  ts: "TypeScript",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Shell",
};

export function rotuloDaLingua(lingua: string | null | undefined): string {
  const chave = lingua?.trim().toLowerCase();
  if (!chave) return "Código";

  return LINGUAS[chave] ?? chave.charAt(0).toUpperCase() + chave.slice(1);
}

/*
  ————————————————————————————————————————————————————————————————————————
  Reconhecer código que veio SEM cerca.

  O que está acima só entende ``` — e ninguém escreve ``` ao colar. O caso que
  motivou isto foi uma mensagem de trinta linhas de TypeScript no canal geral,
  colada crua: virou parágrafo, na fonte de texto, com as quebras preservadas e
  nada mais. O bloco com o nome da linguagem e o botão de copiar já existia; só
  nunca era alcançado.

  A decisão fica no COMPOSER, na hora de colar, e não na hora de desenhar a
  mensagem. É a diferença entre um palpite que a pessoa vê e corrige antes de
  mandar — a cerca aparece no campo, e apagar é `Ctrl+Z` — e um palpite que o
  app aplica sozinho na conversa dos outros, onde um falso positivo transforma
  a lista de compras de alguém num bloco de código para sempre.
  ————————————————————————————————————————————————————————————————————————
*/

/*
  Sinais fracos, somados. Nenhum decide sozinho, e cada um vale conforme a
  força — palavra reservada em duas linhas é mais que em uma, e `chave: valor`
  em três linhas é mais que em uma.

  A tabela em `codigo.test.ts` é a especificação de verdade disto. Ela nasceu
  contra os casos que quebraram: "Total: R$ 1.200,00 / Desconto: ... / Final:
  ..." virava bloco de código, e uma lista de três links também. Mexer nos
  pesos sem rodar a tabela é apostar.
*/
const RESERVADA =
  /^[ \t]*(import|export|from|const|let|var|function|class|def|return|public|private|static|package|using|#include|#!|SELECT|INSERT|UPDATE|DELETE|CREATE|npm|yarn|pnpm|git|docker|sudo|apt|brew|curl|cd|mkdir|chmod)\b/i;

/// `chave: valor` e `chave=valor`, que é a forma do JSON, do YAML e do `.env`
/// — e também a de uma ficha de cadastro, por isso ela nunca basta sozinha.
const ATRIBUICAO = /^[ \t]*[\w.$"'[\]-]+[ \t]*[:=][ \t]*\S/;

const SINAIS: RegExp[] = [
  /// linha terminando em `;` ou abrindo bloco
  /[;{]\s*$/m,
  /// operador que não existe em texto
  /=>|->|::|!==|===|\+=|\|\|/,
  /// comentário
  /^[ \t]*(\/\/|#|\/\*|\*\s)/m,
  /// chamada de função, com o parêntese colado no nome
  /\b[\w.$]+\([^)]*\)/,
  /// etiqueta de marcação
  /<\/?[a-z][\w-]*(\s[^>]*)?\/?>/i,
  /// `arquivo.ext:linha` — rastro de pilha, saída de compilador
  /\b[\w-]+\.(tsx?|jsx?|mjs|py|rb|go|rs|java|kt|php|css|json|html|yml|yaml):\d+/i,
];

/**
 * A densidade de símbolos ESTRUTURAIS, e não de toda pontuação.
 *
 * Foi a segunda tentativa, e a primeira estava errada de um jeito instrutivo:
 * contar tudo o que não é letra fazia "Total: R$ 1.200,00" pontuar 23% — mais
 * alto que muito código de verdade —, porque dois-pontos, vírgula, ponto e
 * cifrão são pontuação de PORTUGUÊS. O que texto não tem é chave, parêntese,
 * colchete, igual e barra: esses só aparecem quando alguém está escrevendo
 * para uma máquina ler.
 */
function densidadeEstrutural(texto: string): number {
  const uteis = texto.replace(/\s/g, "");
  if (!uteis.length) return 0;

  return (uteis.match(/[{}()[\]<>=;|&*/\\+]/g)?.length ?? 0) / uteis.length;
}

/**
 * Isto parece código?
 *
 * A conta é por pontos, e não por portões, porque as linguagens não se parecem
 * entre si. SQL e shell quase não têm símbolo — `SELECT nome FROM pessoas` é
 * quase uma frase — e reprovariam num piso de densidade que o JSON passa
 * folgado; HTML é o contrário, símbolo puro e nenhuma palavra reservada. Com
 * pontos, cada um chega ao mesmo lugar pelo caminho que tem.
 *
 * **Os endereços saem antes da conta.** Uma mensagem com três links é três
 * linhas cheias de `:` e `/` — mais densa que muito código. Era um falso
 * positivo que não se resolve com limite: resolve-se tirando da medida o que
 * não estava sendo medido.
 */
export function pareceCodigo(texto: string): boolean {
  /// Quem já escreveu a cerca decidiu por conta própria; não se mexe.
  if (texto.includes("```")) return false;

  const semLinks = texto.replace(/https?:\/\/\S+/g, " ");
  const linhas = semLinks.split("\n").filter((l) => l.trim());
  if (linhas.length < 3) return false;

  const comReservada = linhas.filter((l) => RESERVADA.test(l)).length;
  const comAtribuicao = linhas.filter((l) => ATRIBUICAO.test(l)).length;
  const recuadas = linhas.filter((l) => /^[ \t]{2,}\S/.test(l)).length;
  /*
    Chave sozinha na linha — `services:`, `api:` — é a cara do YAML, que não
    tem símbolo estrutural NENHUM e por isso não pontuava por densidade. Duas
    delas, e não uma: uma linha terminando em dois-pontos é como todo mundo
    apresenta uma lista ("olha só:"), e promover isso seria pegar metade das
    mensagens do canal.
  */
  const chavesSozinhas = linhas.filter((l) => /^[ \t]*[\w.-]+:[ \t]*$/.test(l)).length;
  const densidade = densidadeEstrutural(semLinks);

  const pontos =
    (comReservada >= 2 ? 3 : comReservada ? 2 : 0) +
    (comAtribuicao >= 3 ? 2 : comAtribuicao ? 1 : 0) +
    (densidade >= 0.08 ? 2 : densidade >= 0.04 ? 1 : 0) +
    (recuadas >= 2 ? 1 : 0) +
    (chavesSozinhas >= 2 ? 1 : 0) +
    SINAIS.filter((sinal) => sinal.test(semLinks)).length;

  return pontos >= 3;
}

/// O que aparece depois da cerca, e vira o rótulo do cabeçalho. Chuta pouco e
/// erra pouco: sem certeza, devolve nada e o bloco se chama "Código" — que é
/// verdade, enquanto "JavaScript" num trecho de Python seria mentira.
export function adivinharLingua(texto: string): string | null {
  const t = texto.trim();

  if (/^[[{]/.test(t)) {
    try {
      JSON.parse(t);
      return "json";
    } catch {
      /// Objeto de JavaScript quase-JSON cai fora daqui e segue a fila.
    }
  }

  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE)\b/i.test(t)) return "sql";
  if (/^\s*<(\?xml|!doctype|html|div|span|section)\b/i.test(t)) return "html";
  if (/^\s*(#!|\$ )|^\s*(npm|yarn|pnpm|git|docker|cd|sudo|apt|brew|curl)\s/m.test(t)) return "sh";
  if (/^\s*(def|class)\s+\w+.*:\s*$/m.test(t) || /^\s*(from|import)\s+\w+\s*$/m.test(t)) return "py";

  /// TypeScript e JavaScript se separam pela anotação de tipo, que é o único
  /// traço que um não tem.
  if (/:\s*(string|number|boolean|void|any|unknown|Promise<)/.test(t)) return "ts";
  if (/\b(const|let|function|=>|import .* from|require\()/.test(t)) return "js";

  return null;
}

/// Embrulha o texto na cerca, com a língua quando dá pra saber. A quebra antes
/// do fecho é obrigatória: sem ela, ``` colado no fim da última linha de
/// código entra no bloco em vez de fechá-lo.
export function cercarCodigo(texto: string): string {
  const limpo = texto.replace(/\s+$/, "");

  return `\`\`\`${adivinharLingua(limpo) ?? ""}\n${limpo}\n\`\`\``;
}
