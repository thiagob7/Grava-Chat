import { useEffect, useState } from "react";

/*
  A proporção da faixa do servidor.

  16/9 é o piso e o palpite: nenhuma faixa fica mais alta que isso, e é o que
  vale enquanto a imagem não carregou. 32/9 é o teto — uma faixa com o dobro da
  largura para a mesma altura, que é o mais estreito que faz sentido desenhar.

  Os dois números são os do Fluxer, e ele os obtém do mesmo jeito: a proporção
  de verdade da imagem, apertada nesse intervalo. Sem o aperto, uma faixa de
  1000×80 renderizaria uma tira de 19 pixels de altura numa barra de 240, e uma
  quadrada viraria um bloco tão alto quanto a lista de canais inteira.
*/
export const PROPORCAO_PADRAO = 16 / 9;
export const PROPORCAO_MAIS_ESTREITA = 32 / 9;

/**
 * A proporção que se pode desenhar, a partir das medidas da imagem.
 *
 * Medida que não existe ou não faz sentido (zero, negativa, `NaN` de uma imagem
 * que falhou) cai no padrão — é melhor desenhar a caixa do palpite do que uma
 * caixa de altura infinita.
 */
export const apertarProporcao = (largura: number, altura: number) => {
  if (!Number.isFinite(largura) || !Number.isFinite(altura) || largura <= 0 || altura <= 0) {
    return PROPORCAO_PADRAO;
  }

  return Math.min(Math.max(largura / altura, PROPORCAO_PADRAO), PROPORCAO_MAIS_ESTREITA);
};

/**
 * Mede a faixa sem esperar ela aparecer na tela.
 *
 * A imagem é desenhada como `background-image`, e fundo não avisa quando
 * carrega — nem diz de que tamanho é. Um `Image()` solto pede o mesmo endereço,
 * cai no mesmo cache do navegador (não é uma segunda ida à rede) e traz as
 * medidas.
 *
 * Até elas chegarem vale o padrão, então a barra desenha a caixa de 16/9 e
 * ajusta uma vez. Trocar de servidor devolve o padrão na hora: manter a
 * proporção do servidor anterior faria a caixa piscar no tamanho errado.
 */
export const useProporcaoDaFaixa = (url: string | null | undefined) => {
  const [proporcao, setProporcao] = useState(PROPORCAO_PADRAO);

  useEffect(() => {
    setProporcao(PROPORCAO_PADRAO);
    if (!url) return;

    let vivo = true;
    const imagem = new Image();

    imagem.onload = () => {
      if (vivo) setProporcao(apertarProporcao(imagem.naturalWidth, imagem.naturalHeight));
    };

    imagem.src = url;

    return () => {
      vivo = false;
    };
  }, [url]);

  return proporcao;
};
