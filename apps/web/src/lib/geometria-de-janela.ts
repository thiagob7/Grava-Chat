/*
  Onde uma janela flutuante está e quanto ela mede.

  Fica fora do componente porque é conta pura: dá para testar sem montar nada, e
  é justamente a parte que erra feio quando erra — janela que some fora da tela,
  ou que volta menor do que dá para usar.
*/

export interface Geometria {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export const MINIMO = { largura: 420, altura: 300 };
const MARGEM = 8;

/*
  Devolve a geometria que cabe: nunca menor do que dá para usar, nunca maior que
  a tela, e nunca fora dela. Quando a tela é menor que o mínimo, a tela ganha —
  janela que passa da borda some pela metade, e a metade que some costuma ser a
  dos botões.
*/
export function encaixarNaTela(pedida: Geometria, tela?: { largura: number; altura: number }) {
  const { largura: telaL, altura: telaA } = tela ?? {
    largura: typeof window === "undefined" ? 1280 : window.innerWidth,
    altura: typeof window === "undefined" ? 800 : window.innerHeight,
  };

  const largura = Math.min(Math.max(MINIMO.largura, pedida.largura), telaL - MARGEM * 2);
  const altura = Math.min(Math.max(MINIMO.altura, pedida.altura), telaA - MARGEM * 2);

  return {
    largura,
    altura,
    x: Math.min(Math.max(MARGEM, pedida.x), Math.max(MARGEM, telaL - largura - MARGEM)),
    y: Math.min(Math.max(MARGEM, pedida.y), Math.max(MARGEM, telaA - altura - MARGEM)),
  };
}

const chaveDe = (id: string) => `gravae:janela:${id}`;

export function geometriaPadrao(tela?: { largura: number; altura: number }): Geometria {
  const { largura: telaL, altura: telaA } = tela ?? {
    largura: typeof window === "undefined" ? 1280 : window.innerWidth,
    altura: typeof window === "undefined" ? 800 : window.innerHeight,
  };

  const largura = Math.min(1180, Math.round(telaL * 0.78));
  const altura = Math.min(820, Math.round(telaA * 0.82));

  return encaixarNaTela({
    largura,
    altura,
    x: Math.round((telaL - largura) / 2),
    y: Math.round((telaA - altura) / 2),
  });
}

export function geometriaGuardada(id: string): Geometria {
  try {
    const salvo = localStorage.getItem(chaveDe(id));
    if (!salvo) return geometriaPadrao();

    const lido = JSON.parse(salvo) as Partial<Geometria>;

    if (![lido.x, lido.y, lido.largura, lido.altura].every((n) => typeof n === "number")) {
      return geometriaPadrao();
    }

    return encaixarNaTela(lido as Geometria);
  } catch {
    return geometriaPadrao();
  }
}

export function guardarGeometria(id: string, geometria: Geometria) {
  try {
    localStorage.setItem(chaveDe(id), JSON.stringify(geometria));
  } catch {
    /// Sem localStorage a janela ainda abre; só não lembra de onde estava.
  }
}
