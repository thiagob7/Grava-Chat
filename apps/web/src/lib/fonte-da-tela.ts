
export interface FonteEmTransmissao {
  nome: string;
  icone: string | null;
}

const NOME_POR_SUPERFICIE: Record<string, string> = {
  browser: "Uma aba do navegador",
  window: "Uma janela",
  monitor: "A tela inteira",
};

const EH_IDENTIFICADOR = /^(screen:|window:|[a-z-]+:\/\/)/i;

export function descreverFonte(
  jaEscolhido: FonteEmTransmissao | null,
  faixa: { label?: string; getSettings?: () => { displaySurface?: string } } | null | undefined,
): FonteEmTransmissao | null {
  if (jaEscolhido) return jaEscolhido;

  const rotulo = faixa?.label?.trim() ?? "";
  if (rotulo && !EH_IDENTIFICADOR.test(rotulo)) return { nome: rotulo, icone: null };

  const superficie = faixa?.getSettings?.().displaySurface ?? "";

  return { nome: NOME_POR_SUPERFICIE[superficie] ?? "Sua tela", icone: null };
}
