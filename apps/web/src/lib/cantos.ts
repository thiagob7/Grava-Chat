/**
 * Onde a janelinha da transmissão pousa quando você a solta.
 *
 * Arrastar livremente parecia flexível e era pior: o card acabava no meio da
 * tela, em cima da conversa ou da lista de canais, e cada vez num lugar
 * diferente. Como ele não tem tamanho ajustável, "qualquer lugar" só produz
 * lugares ruins.
 *
 * Agora ele gruda no canto mais próximo de onde foi largado. O arrasto continua
 * livre enquanto o dedo está na tela — é o pouso que é decidido.
 */
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

/**
 * O canto é escolhido pelo CENTRO do card, não pelo canto superior esquerdo
 * dele. Usando a coordenada de origem, um card largado encostado na borda
 * direita ainda teria `x` menor que o meio da tela em telas largas — e voaria
 * para a esquerda, contra a intenção de quem arrastou.
 */
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
  /*
    `Math.max` com a margem: numa janela mais estreita que o card — o app
    espremido ao lado de outra janela — a conta daria negativo e jogaria o
    card pra fora da tela pela esquerda.
  */
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

/// O atalho do uso real: soltou, encaixa.
export function encaixarNoCanto(card: Retangulo, area: Area) {
  return posicaoDoCanto(cantoMaisProximo(card, area), card, area);
}
