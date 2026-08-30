import React, { useCallback, useRef } from "react";
import type { Decoracao } from "@gravae/shared";

import {
  carregarDecoracao,
  folgaDaDecoracao,
  imagemDaDecoracao,
  segmentoDaDecoracao,
} from "~/lib/cosmeticos/decoracoes";
import { usarLottie } from "~/lib/cosmeticos/lottie";

interface DecoracaoDeArquivoProps {
  decoracao: Decoracao;
  animar: boolean;
  /// o furo da bolinha de status, já calculado pela folga desta decoração
  recorte?: React.CSSProperties;
}

/*
  Decoração que vem de arquivo, seja Lottie ou imagem.

  A escolha entre as duas mora AQUI, e não em quem chama: o `Avatar` e a aba de
  enfeites só perguntam `ehDeArquivo` e montam este componente.

  As duas famílias são componentes SEPARADOS e com `key` própria, e isso não é
  organização — é correção de um travamento.

  Quando os dois ramos devolviam `<span>`, o React reaproveitava o mesmo nó do
  DOM ao trocar de decoração. O lottie-web limpa o `innerHTML` do container ao
  montar; então, ao voltar de Lottie para imagem, o React tentava remover um
  `<img>` que o player já tinha apagado e estourava `removeChild: The node to
  be removed is not a child of this node` — derrubando a árvore inteira, tela
  preta. Com `key` diferente por família e por decoração, cada montagem ganha
  um nó novo e ninguém mexe no nó do outro.
*/
export const DecoracaoDeArquivo: React.FC<DecoracaoDeArquivoProps> = ({
  decoracao,
  animar,
  recorte,
}) => {
  const inset = folgaDaDecoracao(decoracao);
  const url = imagemDaDecoracao(decoracao);

  if (url)
    return <ComoImagem key={`imagem:${decoracao}`} url={url} inset={inset} recorte={recorte} />;

  return (
    <ComoLottie
      key={`lottie:${decoracao}`}
      decoracao={decoracao}
      animar={animar}
      inset={inset}
      recorte={recorte}
    />
  );
};

/*
  A imagem vai DENTRO de um span, e não recebe o `inset` direto.

  Elemento substituído com `width: auto` usa o tamanho intrínseco do arquivo,
  então os quatro insets sozinhos não esticam um `<img>` — ele ficava com o
  tamanho do SVG, ancorado no canto. O span não é substituído: ele estica pelos
  insets, e a imagem preenche o span.
*/
const ComoImagem: React.FC<{ url: string; inset: string; recorte?: React.CSSProperties }> = ({
  url,
  inset,
  recorte,
}) => (
  <span aria-hidden className="gc-camada" style={{ inset, ...recorte }}>
    <img
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

  /// Sem filhos no JSX de propósito: o conteúdo deste span é do player, e o
  /// React não pode disputar o nó com ele.
  return <span ref={caixa} aria-hidden className="gc-camada" style={{ inset, ...recorte }} />;
};
