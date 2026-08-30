import React from "react";

/*
  O fundo da marca: um degradê da cor do Gravaê com o "G" e os pontos
  repetidos por cima, bem apagados.

  Não é o padrão de lanchinhos que a gente viu por aí — aquilo é a marca dos
  outros. Aqui o motivo é o nosso: o "G" e o ponto vermelho que fecha o
  logotipo, alternados em duas fileiras deslocadas pra grade não ficar óbvia, e
  a onda de áudio no meio, que é o que este app faz.

  Fica atrás do cartão de login e do de convite — as duas telas que alguém de
  fora vê primeiro, e as únicas em que o app não tem conteúdo próprio pra
  mostrar. É o único lugar onde a marca aparece inteira.
*/
export const FundoDaMarca: React.FC<{ className?: string }> = ({ className }) => (
  <div aria-hidden className={className}>
    <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand-hover" />

    <svg className="absolute inset-0 size-full" role="presentation">
      <defs>
        <pattern id="marca-gravae" width="180" height="180" patternUnits="userSpaceOnUse">
          <image href="/brand/logo g branco.svg" x="14" y="18" width="34" height="34" opacity="0.10" />
          <circle cx="54" cy="52" r="4" fill="white" opacity="0.10" />

          {/*
            A onda: três traços de alturas diferentes, como um medidor de voz
            parado. Curtos de propósito — desenho de fundo que compete com o
            conteúdo deixa de ser fundo.
          */}
          <g opacity="0.09" stroke="white" strokeWidth="4" strokeLinecap="round">
            <line x1="112" y1="30" x2="112" y2="46" />
            <line x1="126" y1="22" x2="126" y2="54" />
            <line x1="140" y1="32" x2="140" y2="44" />
          </g>

          <image href="/brand/logo g branco.svg" x="104" y="108" width="34" height="34" opacity="0.10" />
          <circle cx="144" cy="142" r="4" fill="white" opacity="0.10" />

          <g opacity="0.09" stroke="white" strokeWidth="4" strokeLinecap="round">
            <line x1="24" y1="120" x2="24" y2="136" />
            <line x1="38" y1="112" x2="38" y2="144" />
            <line x1="52" y1="122" x2="52" y2="134" />
          </g>
        </pattern>
      </defs>

      <rect width="100%" height="100%" fill="url(#marca-gravae)" />
    </svg>
  </div>
);
