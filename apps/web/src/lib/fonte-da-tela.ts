/**
 * Como chamar o que está sendo transmitido.
 *
 * Três origens de informação, em ordem de qualidade — e a diferença entre elas
 * não é preguiça, é o que cada ambiente entrega.
 *
 * 1. **O aplicativo de desktop** sabe o nome de verdade. O `desktopCapturer` do
 *    Electron devolve "Tela 1", "Visual Studio Code", o nome do jogo, e ainda o
 *    ícone do app. O `SeletorDeTela` guarda isso ao escolher, e nada aqui
 *    melhora esse dado.
 *
 * 2. **O rótulo da faixa**, quando é um nome. Às vezes o navegador põe ali o
 *    título da janela, e nesse caso ele serve.
 *
 * 3. **O tipo de superfície**, que é o que sobra no Chrome. Compartilhando uma
 *    ABA, o rótulo vem como `web-contents-media-stream://5/1` — um
 *    identificador interno, não um nome. O navegador não expõe o título da aba
 *    por design, então o melhor honesto é dizer O QUE está sendo transmitido
 *    ("Uma aba do navegador") em vez de inventar um nome ou cair num genérico
 *    que não informa nada.
 */
export interface FonteEmTransmissao {
  nome: string;
  icone: string | null;
}

/*
  O que o navegador chama de "superfície": a aba, a janela do app, ou o monitor
  inteiro. Vem de `MediaTrackSettings.displaySurface`, que nem toda versão do
  lib.dom declara — daí a leitura ser defensiva na função abaixo.
*/
const NOME_POR_SUPERFICIE: Record<string, string> = {
  browser: "Uma aba do navegador",
  window: "Uma janela",
  monitor: "A tela inteira",
};

/*
  Rótulos que são identificador e não nome. O `esquema://` cobre o caso da aba
  no Chrome (`web-contents-media-stream://…`); os dois primeiros cobrem os
  formatos antigos de tela e janela.
*/
const EH_IDENTIFICADOR = /^(screen:|window:|[a-z-]+:\/\/)/i;

export function descreverFonte(
  jaEscolhido: FonteEmTransmissao | null,
  faixa: { label?: string; getSettings?: () => { displaySurface?: string } } | null | undefined,
): FonteEmTransmissao | null {
  /// O desktop já sabe o nome bom — não há o que melhorar.
  if (jaEscolhido) return jaEscolhido;

  const rotulo = faixa?.label?.trim() ?? "";
  if (rotulo && !EH_IDENTIFICADOR.test(rotulo)) return { nome: rotulo, icone: null };

  const superficie = faixa?.getSettings?.().displaySurface ?? "";

  return { nome: NOME_POR_SUPERFICIE[superficie] ?? "Sua tela", icone: null };
}
