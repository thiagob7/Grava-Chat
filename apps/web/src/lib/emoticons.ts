
const TABELA: [RegExp, string][] = [
  [/(^|\s):-?\)(?=\s|$)/g, "$1🙂"],
  [/(^|\s):-?D(?=\s|$)/g, "$1😄"],
  [/(^|\s):-?\((?=\s|$)/g, "$1🙁"],
  [/(^|\s);-?\)(?=\s|$)/g, "$1😉"],
  [/(^|\s):-?[Pp](?=\s|$)/g, "$1😛"],
  [/(^|\s):-?[Oo](?=\s|$)/g, "$1😮"],
  [/(^|\s):['’]-?\((?=\s|$)/g, "$1😢"],
  [/(^|\s)<3(?=\s|$)/g, "$1❤️"],
  [/(^|\s):\/(?=\s|$)/g, "$1😕"],
  [/(^|\s)\^\^(?=\s|$)/g, "$1😊"],
];

export function converterEmoticons(texto: string): string {
  return TABELA.reduce((atual, [padrao, emoji]) => atual.replace(padrao, emoji), texto);
}
