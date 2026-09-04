
export type Canto = "superior-esquerdo" | "superior-direito" | "inferior-esquerdo" | "inferior-direito";

export interface Retangulo {
  x: number;
  y: number;
  largura: number;
  altura: number;
}

export interface Area {
  largura: number;
  altura: number;
  margem: number;
}

export function cantoMaisProximo(card: Retangulo, area: Area): Canto {
  const centroX = card.x + card.largura / 2;
  const centroY = card.y + card.altura / 2;

  const direita = centroX >= area.largura / 2;
  const baixo = centroY >= area.altura / 2;

  if (baixo) return direita ? "inferior-direito" : "inferior-esquerdo";
  return direita ? "superior-direito" : "superior-esquerdo";
}

export function posicaoDoCanto(canto: Canto, card: { largura: number; altura: number }, area: Area) {
  const esquerda = area.margem;
  const topo = area.margem;
  const direita = Math.max(area.margem, area.largura - card.largura - area.margem);
  const baixo = Math.max(area.margem, area.altura - card.altura - area.margem);

  switch (canto) {
    case "superior-esquerdo":
      return { x: esquerda, y: topo };
    case "superior-direito":
      return { x: direita, y: topo };
    case "inferior-esquerdo":
      return { x: esquerda, y: baixo };
    case "inferior-direito":
      return { x: direita, y: baixo };
  }
}

export function encaixarNoCanto(card: Retangulo, area: Area) {
  return posicaoDoCanto(cantoMaisProximo(card, area), card, area);
}
