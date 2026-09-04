/**
 * O emoji desenhado pelo Twemoji, e não pela fonte do sistema.
 *
 * Sem isto, quem desenha é `"Apple Color Emoji"`/`"Segoe UI Emoji"` (veja o
 * `tokens.css`), e o MESMO emoji aparece diferente para cada pessoa: você manda
 * um sorriso da Apple e do outro lado chega o da Microsoft. Numa conversa em
 * que emoji também é reação e apelido, isso não é detalhe — é a mensagem
 * mudando de cara no caminho.
 *
 * Os arquivos vêm do pacote `@twemoji/svg` e são copiados para `public/emoji/`
 * pelo `scripts/copiar-emoji.mjs`. O nome de cada um é o codepoint em
 * hexadecimal minúsculo, com os pedaços separados por hífen — daí não haver
 * tabela nenhuma aqui: a URL sai do próprio caractere.
 */

/*
  Como o Twemoji nomeia os arquivos, e as duas regras que não são óbvias:

  1. O SELETOR DE VARIAÇÃO (`U+FE0F`) sai do nome — ele é o que pede "desenhe
     como emoji, não como símbolo", e o Twemoji já é o desenho. `❤️` (2764 fe0f)
     vira `2764.svg`.
  2. …exceto em sequências com ZWJ (`U+200D`), onde o `FE0F` faz parte da
     identidade da combinação. `👨‍❤️‍👨` precisa dele para não colidir com outra
     sequência.

  É a mesma regra do `toCodePoint` do Twemoji original. Sem a exceção do ZWJ,
  famílias e casais caem em arquivos que não existem.
*/
const SELETOR_DE_VARIACAO = /\uFE0F/g;
const ZWJ = "\u200D";

export function codepointDoEmoji(emoji: string): string {
  const texto = emoji.includes(ZWJ) ? emoji : emoji.replace(SELETOR_DE_VARIACAO, "");

  return [...texto]
    .map((caractere) => caractere.codePointAt(0)!.toString(16))
    .join("-");
}

export const urlDoEmoji = (emoji: string) => `/emoji/${codepointDoEmoji(emoji)}.svg`;

/*
  Acha emoji no meio do texto.

  A base é `Extended_Pictographic`, e NÃO `\p{Emoji}`: esta última casa com os
  dígitos de 0 a 9, com `#` e com `*`, porque eles podem virar teclinha. Usá-la
  transformaria todo número de toda mensagem numa imagem. As teclinhas entram
  por outro caminho, exigindo o `U+20E3` que as define.

  O resto são as três formas de emoji composto: par de indicadores regionais
  (bandeiras), modificador de tom de pele, e sequências ligadas por ZWJ
  (famílias, profissões, casais).
*/
export const EMOJI =
  /(?:\p{Regional_Indicator}\p{Regional_Indicator}|(?:\p{Extended_Pictographic}|[0-9#*]\uFE0F?\u20E3)(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D(?:\p{Extended_Pictographic}|\p{Regional_Indicator}\p{Regional_Indicator})(?:\p{Emoji_Modifier}|\uFE0F)?)*)/gu;
