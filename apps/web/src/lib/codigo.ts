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
