import React from "react";

/*
  Tela de espera: o "G" da marca parado e o ponto vermelho pulsando ao lado.

  O ponto é o que pisca, não o logotipo inteiro: marca piscando parece defeito
  de renderização, enquanto o pulso num detalhe lê como "está trabalhando" — e é
  o mesmo ponto vermelho que fecha a marca no login.

  Mora aqui, e não dentro das rotas, porque a queda de conexão usa a MESMA
  tela: quem já viu isto na abertura reconhece na hora que o app está esperando
  o servidor, e não travado.
*/
export const Splash: React.FC<{ legenda?: React.ReactNode }> = ({ legenda }) => (
  <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-surface-2">
    <div className="flex items-center gap-2">
      <img
        src="/brand/logo g branco.svg"
        alt=""
        className="h-12 w-auto select-none"
        draggable={false}
      />
      <span className="mb-1 size-3 animate-pulse self-end rounded-full bg-brand" />
    </div>

    {legenda}
  </div>
);
