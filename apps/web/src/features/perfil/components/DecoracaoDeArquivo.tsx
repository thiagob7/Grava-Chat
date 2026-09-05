import React, { useCallback, useRef } from "react";
import type { Decoracao } from "@gravae/shared";

import {
  carregarDecoracao,
  folgaDaDecoracao,
  imagemDaDecoracao,
  segmentoDaDecoracao,
} from "~/features/perfil/lib/decoracoes";
import { usarLottie } from "~/features/perfil/lib/lottie";

interface DecoracaoDeArquivoProps {
  decoracao: Decoracao;
  animar: boolean;
  recorte?: React.CSSProperties;
}

export const DecoracaoDeArquivo: React.FC<DecoracaoDeArquivoProps> = ({
  decoracao,
  animar,
  recorte,
}) => {
  const inset = folgaDaDecoracao(decoracao);
  const url = imagemDaDecoracao(decoracao);

  if (url)
    return <ComoImagem data-gc="perfil.decoracao-de-arquivo.como-imagem" key={`imagem:${decoracao}`} url={url} inset={inset} recorte={recorte} />;

  return (
    <ComoLottie data-gc="perfil.decoracao-de-arquivo.como-lottie"
      key={`lottie:${decoracao}`}
      decoracao={decoracao}
      animar={animar}
      inset={inset}
      recorte={recorte}
    />
  );
};

const ComoImagem: React.FC<{ url: string; inset: string; recorte?: React.CSSProperties }> = ({
  url,
  inset,
  recorte,
}) => (
  <span data-gc="perfil.decoracao-de-arquivo.span" aria-hidden className="gc-camada" style={{ inset, ...recorte }}>
    <img data-gc="perfil.decoracao-de-arquivo.img"
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      className="size-full object-contain"
    />
  </span>
);

const ComoLottie: React.FC<{
  decoracao: Decoracao;
  animar: boolean;
  inset: string;
  recorte?: React.CSSProperties;
}> = ({ decoracao, animar, inset, recorte }) => {
  const caixa = useRef<HTMLSpanElement>(null);

  usarLottie(caixa, {
    chave: decoracao,
    carregar: useCallback(() => carregarDecoracao(decoracao), [decoracao]),
    animar,
    repetir: true,
    segmento: segmentoDaDecoracao(decoracao),
  });

  return <span data-gc="perfil.decoracao-de-arquivo.span--2" ref={caixa} aria-hidden className="gc-camada" style={{ inset, ...recorte }} />;
};
