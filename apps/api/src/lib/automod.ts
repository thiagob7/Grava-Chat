export type Gatilho = "WORDS" | "MENTION_SPAM" | "LINKS";

export interface RegraDeConteudo {
  trigger: Gatilho;
  palavras: string[];
  limiteMencoes: number | null;
}

export const normalizar = (texto: string) =>
  texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const ESCAPE = /[.*+?^${}()|[\]\\]/g;
const LINK = /\bhttps?:\/\/\S+|\bwww\.\S+\.\S+/i;

function contarMencoes(content: string) {
  const usuarios = content.match(/<@[a-f\d]{24}>/gi)?.length ?? 0;
  const cargos = content.match(/<@&[a-f\d]{24}>/gi)?.length ?? 0;
  const todos = content.match(/@(everyone|here)\b/gi)?.length ?? 0;

  return usuarios + cargos + todos;
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

    const padrao = new RegExp(`(^|[^\\p{L}\\p{N}])${alvo.replace(ESCAPE, "\\$&")}([^\\p{L}\\p{N}]|$)`, "u");
    if (padrao.test(texto)) return `palavra bloqueada: ${palavra}`;
  }

  return null;
}
