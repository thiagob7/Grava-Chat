import React, { useId } from "react";
import type { PresenceStatus } from "@gravae/shared";

export type TipoDeStatus = PresenceStatus | "VOZ";

/*
  As bolinhas de status, em SVG.

  As formas seguem a convenção que todo mundo já lê sem pensar — cheia para
  online, meia-lua para ausente, barra para não perturbe, anel vazado para
  offline. Elas são convenção de mercado, não marca de ninguém.

  Feitas aqui em vez de usar os PNGs do kit do Discord por dois motivos, nesta
  ordem: aqueles são arquivos de arte de outra empresa, e vetor não borra —
  a mesma bolinha serve o avatar de 20px da lista e o de 80px do perfil, e
  acompanha a cor do tema em vez de trazer a paleta de fora.

  A forma é o que carrega o significado, e não só a cor: quem não distingue
  verde de vermelho ainda distingue círculo cheio de círculo com uma barra.
*/
export const IconeDeStatus: React.FC<{
  tipo: TipoDeStatus;
  tamanho: number;
  className?: string;
}> = ({ tipo, tamanho, className }) => {
  const id = useId();

  const cor =
    tipo === "VOZ" || tipo === "ONLINE"
      ? "var(--color-online)"
      : tipo === "IDLE"
        ? "var(--color-idle)"
        : tipo === "DND"
          ? "var(--color-dnd)"
          : "var(--color-ink-faint)";

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <defs>
        <mask id={id}>
          <circle cx="12" cy="12" r="12" fill="white" />

          {/* ausente: a mordida que faz a meia-lua */}
          {tipo === "IDLE" && <circle cx="5" cy="5" r="10" fill="black" />}

          {/* não perturbe: a barra vazada no meio */}
          {tipo === "DND" && <rect x="4" y="9.5" width="16" height="5" rx="2.5" fill="black" />}

          {/* offline: anel — o vazio no meio é o que diz "não está" */}
          {tipo === "OFFLINE" && <circle cx="12" cy="12" r="6" fill="black" />}
        </mask>
      </defs>

      <circle cx="12" cy="12" r="12" fill={cor} mask={`url(#${id})`} />

      {/*
        Em voz o desenho é outro: um alto-falante dentro do círculo cheio. Não
        é um estado de presença — é o que a pessoa está FAZENDO agora, e por
        isso ganha símbolo em vez de mais uma cor pra decorar.
      */}
      {tipo === "VOZ" && (
        <path
          d="M13.5 6.8 10 9.8H7.6a.9.9 0 0 0-.9.9v2.6c0 .5.4.9.9.9H10l3.5 3a.6.6 0 0 0 1-.5V7.3a.6.6 0 0 0-1-.5Zm2.9 1.9a.85.85 0 0 0-.2 1.2 3.6 3.6 0 0 1 0 4.2.85.85 0 1 0 1.4 1 5.3 5.3 0 0 0 0-6.2.85.85 0 0 0-1.2-.2Z"
          fill="white"
        />
      )}
    </svg>
  );
};
