/**
 * A regra do AutoMod, sem banco e sem contexto: entra texto, sai o motivo do
 * bloqueio (ou null). Fica separada porque é a parte fácil de errar em
 * silêncio — filtro que não pega nada e filtro que pega tudo têm a mesma cara
 * em produção.
 */

export type Gatilho = "WORDS" | "MENTION_SPAM" | "LINKS";

export interface RegraDeConteudo {
  trigger: Gatilho;
  palavras: string[];
  limiteMencoes: number | null;
}

/**
 * Minúsculas e sem acento dos dois lados. Sem isso, "Idiota" e "idiotá" passam
 * por uma lista que tem "idiota" — e quem configurou jura que configurou.
 */
export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const ESCAPE = /[.*+?^${}()|[\]\\]/g;
const LINK = /\bhttps?:\/\/\S+|\bwww\.\S+\.\S+/i;

/** `<@id>`, `@everyone` e `@here` contam igual: todos tiram alguém do sério. */
function contarMencoes(content: string) {
  const usuarios = content.match(/<@[a-f\d]{24}>/gi)?.length ?? 0;
  const todos = content.match(/@(everyone|here)\b/gi)?.length ?? 0;

  return usuarios + todos;
}

export function violacao(content: string, regra: RegraDeConteudo): string | null {
  if (regra.trigger === "LINKS") {
    return LINK.test(content) ? "link" : null;
  }

  if (regra.trigger === "MENTION_SPAM") {
    const limite = regra.limiteMencoes ?? 5;
    return contarMencoes(content) >= limite ? "menções demais" : null;
  }

  const texto = normalizar(content);

  for (const palavra of regra.palavras) {
    const alvo = normalizar(palavra).trim();
    if (!alvo) continue;

    /**
     * Fronteira de palavra "à mão": `\b` do JS não considera acento nem
     * caracteres de outros alfabetos, e a lista já veio normalizada.
     * Assim "burro" pega "burro!" mas não "burrocracia".
     */
    const padrao = new RegExp(`(^|[^\\p{L}\\p{N}])${alvo.replace(ESCAPE, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u");
    if (padrao.test(texto)) return `palavra bloqueada: ${palavra}`;
  }

  return null;
}
