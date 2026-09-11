
const TABLE: [RegExp, string][] = [
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

export function convertEmoticons(text: string): string {
  return TABLE.reduce((current, [fallback, emoji]) => current.replace(fallback, emoji), text);
}
