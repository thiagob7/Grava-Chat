

const CERCA = /```([^\n`]*)\n?([\s\S]*?)```/g;
const EM_LINHA = /`([^`\n]*[^\s`][^`\n]*)`/g;

export type Pedaco =
  | { tipo: "texto"; texto: string }
  | { tipo: "linha"; codigo: string }
  | { tipo: "bloco"; codigo: string; lingua: string | null };

export function partirEmCodigo(conteudo: string): Pedaco[] {
  const pedacos: Pedaco[] = [];
  let ultimo = 0;

  for (const casamento of conteudo.matchAll(CERCA)) {
    if (casamento.index === undefined) continue;

    const [inteiro, informe, corpo] = casamento;
    const codigo = (corpo ?? "").replace(/\n$/, "");

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

function primeiraPalavra(informe: string | undefined): string | null {
  return (informe ?? "").trim().split(/\s+/)[0] || null;
}

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

const RESERVADA =
  /^[ \t]*(import|export|from|const|let|var|function|class|def|return|public|private|static|package|using|#include|#!|SELECT|INSERT|UPDATE|DELETE|CREATE|npm|yarn|pnpm|git|docker|sudo|apt|brew|curl|cd|mkdir|chmod)\b/i;

const ATRIBUICAO = /^[ \t]*[\w.$"'[\]-]+[ \t]*[:=][ \t]*\S/;

const SINAIS: RegExp[] = [
  /[;{]\s*$/m,
  /=>|->|::|!==|===|\+=|\|\|/,
  /^[ \t]*(\/\/|#|\/\*|\*\s)/m,
  /\b[\w.$]+\([^)]*\)/,
  /<\/?[a-z][\w-]*(\s[^>]*)?\/?>/i,
  /\b[\w-]+\.(tsx?|jsx?|mjs|py|rb|go|rs|java|kt|php|css|json|html|yml|yaml):\d+/i,
];

function densidadeEstrutural(texto: string): number {
  const uteis = texto.replace(/\s/g, "");
  if (!uteis.length) return 0;

  return (uteis.match(/[{}()[\]<>=;|&*/\\+]/g)?.length ?? 0) / uteis.length;
}

export function pareceCodigo(texto: string): boolean {
  if (texto.includes("```")) return false;

  const semLinks = texto.replace(/https?:\/\/\S+/g, " ");
  const linhas = semLinks.split("\n").filter((l) => l.trim());
  if (linhas.length < 3) return false;

  const comReservada = linhas.filter((l) => RESERVADA.test(l)).length;
  const comAtribuicao = linhas.filter((l) => ATRIBUICAO.test(l)).length;
  const recuadas = linhas.filter((l) => /^[ \t]{2,}\S/.test(l)).length;
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

  /// Uma folha que abre com regra-arroba não é outra coisa.
  if (/^\s*@(import|media|charset|font-face|keyframes|tailwind)\b/m.test(t)) return "css";
  if (/^\s*(#!|\$ )|^\s*(npm|yarn|pnpm|git|docker|cd|sudo|apt|brew|curl)\s/m.test(t)) return "sh";
  if (/^\s*(def|class)\s+\w+.*:\s*$/m.test(t) || /^\s*(from|import)\s+\w+\s*$/m.test(t)) return "py";

  if (/:\s*(string|number|boolean|void|any|unknown|Promise<)/.test(t)) return "ts";
  if (/\b(const|let|function|=>|import .* from|require\()/.test(t)) return "js";

  /*
    Por último, e só depois de JavaScript ter tido a vez: um seletor seguido de
    bloco com `propriedade: valor`. O seletor não pode ter `=` nem parêntese,
    senão `const a = { cor: azul }` entraria aqui.
  */
  if (/(^|\})\s*[.#:a-z[][^{}\n=()]{0,120}\{[^}]*[a-z-]+\s*:[^;}]+[;}]/i.test(t)) {
    return "css";
  }

  return null;
}

export function cercarCodigo(texto: string): string {
  const limpo = texto.replace(/\s+$/, "");

  return `\`\`\`${adivinharLingua(limpo) ?? ""}\n${limpo}\n\`\`\``;
}
