import { useEffect, useState } from "react";

export const PROPORCAO_PADRAO = 16 / 9;
export const PROPORCAO_MAIS_ESTREITA = 32 / 9;

export const apertarProporcao = (largura: number, altura: number) => {
  if (!Number.isFinite(largura) || !Number.isFinite(altura) || largura <= 0 || altura <= 0) {
    return PROPORCAO_PADRAO;
  }

  return Math.min(Math.max(largura / altura, PROPORCAO_PADRAO), PROPORCAO_MAIS_ESTREITA);
};

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
