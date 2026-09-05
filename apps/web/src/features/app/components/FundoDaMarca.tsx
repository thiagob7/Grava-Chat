import React from "react";

export const FundoDaMarca: React.FC<{ className?: string }> = ({ className }) => (
  <div data-gc="app.fundo-da-marca.div" aria-hidden className={className}>
    <div data-gc="app.fundo-da-marca.div--2" className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand-hover" />

    <svg data-gc="app.fundo-da-marca.svg" className="absolute inset-0 size-full" role="presentation">
      <defs data-gc="app.fundo-da-marca.defs">
        <pattern data-gc="app.fundo-da-marca.pattern" id="marca-gravae" width="180" height="180" patternUnits="userSpaceOnUse">
          <image data-gc="app.fundo-da-marca.image" href="/brand/logo g branco.svg" x="14" y="18" width="34" height="34" opacity="0.10" />
          <circle data-gc="app.fundo-da-marca.circle" cx="54" cy="52" r="4" fill="white" opacity="0.10" />

          <g data-gc="app.fundo-da-marca.g" opacity="0.09" stroke="white" strokeWidth="4" strokeLinecap="round">
            <line data-gc="app.fundo-da-marca.line" x1="112" y1="30" x2="112" y2="46" />
            <line data-gc="app.fundo-da-marca.line--2" x1="126" y1="22" x2="126" y2="54" />
            <line data-gc="app.fundo-da-marca.line--3" x1="140" y1="32" x2="140" y2="44" />
          </g>

          <image data-gc="app.fundo-da-marca.image--2" href="/brand/logo g branco.svg" x="104" y="108" width="34" height="34" opacity="0.10" />
          <circle data-gc="app.fundo-da-marca.circle--2" cx="144" cy="142" r="4" fill="white" opacity="0.10" />

          <g data-gc="app.fundo-da-marca.g--2" opacity="0.09" stroke="white" strokeWidth="4" strokeLinecap="round">
            <line data-gc="app.fundo-da-marca.line--4" x1="24" y1="120" x2="24" y2="136" />
            <line data-gc="app.fundo-da-marca.line--5" x1="38" y1="112" x2="38" y2="144" />
            <line data-gc="app.fundo-da-marca.line--6" x1="52" y1="122" x2="52" y2="134" />
          </g>
        </pattern>
      </defs>

      <rect data-gc="app.fundo-da-marca.rect" width="100%" height="100%" fill="url(#marca-gravae)" />
    </svg>
  </div>
);
