import React from "react";

/*
  Desenhadas aqui em SVG, e não baixadas de um banco de animações: assim as
  cores saem dos tokens do tema — funcionam no claro e no escuro, e seguem a
  cor de destaque que a pessoa escolher — e não há licença de terceiro
  presa ao produto.

  A flutuação usa motion-safe: quem pede menos movimento no sistema recebe a
  arte parada.
*/

const Fundo: React.FC = () => (
  <>
    <defs>
      <linearGradient id="arte-limite-brilho" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.35" />
        <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="arte-limite-papel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-surface-4)" />
        <stop offset="100%" stopColor="var(--color-surface-2)" />
      </linearGradient>
    </defs>

    <circle cx="60" cy="60" r="58" fill="url(#arte-limite-brilho)" />
  </>
);

/// Uma página cujas linhas não cabem: as três últimas passam da borda.
export const ArteDeTextoLongo: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    className="size-28 motion-safe:animate-[flutuar_4s_ease-in-out_infinite]"
    role="img"
    aria-hidden="true"
  >
    <Fundo />

    <rect
      x="32"
      y="22"
      width="56"
      height="70"
      rx="6"
      fill="url(#arte-limite-papel)"
      stroke="var(--color-line)"
    />

    {[34, 43, 52, 61].map((y) => (
      <rect
        key={y}
        x="41"
        y={y}
        width="38"
        height="4"
        rx="2"
        fill="var(--color-ink-faint)"
        opacity="0.5"
      />
    ))}

    {[74, 83, 92].map((y, i) => (
      <rect
        key={y}
        x="41"
        y={y}
        width={38 - i * 6}
        height="4"
        rx="2"
        fill="var(--color-brand)"
        opacity={0.9 - i * 0.28}
      />
    ))}

    <path
      d="M32 88h56"
      stroke="var(--color-brand)"
      strokeWidth="2"
      strokeDasharray="4 4"
      strokeLinecap="round"
    />
  </svg>
);

/// Um arquivo que não passa pela porta: a seta bate no traço do limite.
export const ArteDeArquivoGrande: React.FC = () => (
  <svg
    viewBox="0 0 120 120"
    className="size-28 motion-safe:animate-[flutuar_4s_ease-in-out_infinite]"
    role="img"
    aria-hidden="true"
  >
    <Fundo />

    <path
      d="M40 26h26l16 16v48a6 6 0 0 1-6 6H40a6 6 0 0 1-6-6V32a6 6 0 0 1 6-6Z"
      fill="url(#arte-limite-papel)"
      stroke="var(--color-line)"
    />

    <path
      d="M66 26v12a4 4 0 0 0 4 4h12"
      fill="none"
      stroke="var(--color-line)"
      strokeWidth="2"
    />

    <circle cx="58" cy="70" r="15" fill="var(--color-brand)" opacity="0.16" />

    <path
      d="M58 62v16m0 0-6-6m6 6 6-6"
      stroke="var(--color-brand)"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d="M44 88h28"
      stroke="var(--color-danger)"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);
