/**
 * `:)` vira 🙂, na hora de enviar.
 *
 * A conversão acontece no envio e não enquanto se digita, de propósito: com a
 * troca no meio da digitação, apagar o emoji devolvia o `:)` e o campo entrava
 * numa briga com quem estava escrevendo. Aqui o que se vê é o que se digitou,
 * até a mensagem sair.
 *
 * A lista é curta porque emoticon é hábito de dedo, não vocabulário: estes são
 * os que as pessoas escrevem sem pensar.
 */
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
