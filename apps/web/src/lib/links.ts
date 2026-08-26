/**
 * Os links de uma mensagem, lidos uma vez só.
 *
 * Duas telas precisam disso e precisam concordar: o texto, que sublinha e
 * transforma em `<a>`, e o cartão, que vai buscar as metatags. Quando as duas
 * tinham a sua própria expressão, a segunda achava link que a primeira não
 * sublinhava.
 */
export const LINK = /https?:\/\/[^\s<]+/g;

/// Pontuação colada no fim ("olha isso: https://a.io/b.") não é do endereço.
export const limparLink = (url: string) => url.replace(/[.,;:!?)\]}]+$/, "");

export const EH_IMAGEM = /\.(gif|png|jpe?g|webp|avif)(\?|#|$)/i;

export const SO_UM_LINK = /^https?:\/\/\S+$/;

/**
 * Os endereços que merecem cartão, em ordem, sem repetir.
 *
 * O teto existe porque o cartão é grande: uma mensagem com dez links viraria
 * uma parede, e o Discord também para nos primeiros.
 */
export function extrairLinks(conteudo: string, maximo = 3): string[] {
  const achados = new Set<string>();

  for (const [bruto] of conteudo.matchAll(LINK)) {
    const url = limparLink(bruto);

    /// A imagem já é desenhada inteira embaixo da mensagem; um cartão dela
    /// seria a mesma imagem duas vezes.
    if (EH_IMAGEM.test(url)) continue;

    achados.add(url);
    if (achados.size >= maximo) break;
  }

  return [...achados];
}
