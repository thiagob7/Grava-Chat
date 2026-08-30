import React from "react";

/*
  Tela de espera: o "G" da marca respirando.

  Antes havia um ponto vermelho pulsando ao lado do logotipo — e o logotipo JÁ
  tem um ponto vermelho, que faz parte do desenho. Eram dois pontos na tela,
  um aceso e um parado, e o que ficava piscando era o intruso. Quem olha lê
  isso como defeito de renderização, não como "está carregando".

  Agora quem respira é a marca inteira: ela some e volta devagar, sem sair do
  lugar. É o único movimento na tela, então diz "estou trabalhando" sem
  competir com nada.

  Mora aqui, e não dentro das rotas, porque a queda de conexão usa a MESMA
  tela: quem já viu isto na abertura reconhece na hora que o app está esperando
  o servidor, e não travado.
*/
export const Splash: React.FC<{ legenda?: React.ReactNode }> = ({ legenda }) => (
  <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-surface-2">
    <img
      src="/brand/logo g branco.svg"
      alt=""
      className="h-12 w-auto animate-pulse select-none"
      draggable={false}
    />

    {legenda}
  </div>
);
