import React, { useId } from "react";
import type { PresenceStatus } from "@gravae/shared";

export type TipoDeStatus = PresenceStatus | "VOZ";

export const IconeDeStatus: React.FC<{
  tipo: TipoDeStatus;
  tamanho: number;
  className?: string;
}> = ({ tipo, tamanho, className }) => {
  const id = `status${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const cor =
    tipo === "VOZ" || tipo === "ONLINE"
      ? "var(--color-online)"
      : tipo === "IDLE"
        ? "var(--color-idle)"
        : tipo === "DND"
          ? "var(--color-dnd)"
          : "var(--color-ink-faint)";

  return (
    <svg data-gc="perfil.icone-de-status.svg"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <defs data-gc="perfil.icone-de-status.defs">
        <mask data-gc="perfil.icone-de-status.mask" id={id}>
          <circle data-gc="perfil.icone-de-status.circle" cx="12" cy="12" r="12" fill="white" />

          {tipo === "IDLE" && <circle data-gc="perfil.icone-de-status.circle--2" cx="5" cy="5" r="10" fill="black" />}

          {tipo === "DND" && <rect data-gc="perfil.icone-de-status.rect" x="4" y="9.5" width="16" height="5" rx="2.5" fill="black" />}

          {tipo === "OFFLINE" && <circle data-gc="perfil.icone-de-status.circle--3" cx="12" cy="12" r="6" fill="black" />}
        </mask>
      </defs>

      <circle data-gc="perfil.icone-de-status.circle--4" cx="12" cy="12" r="12" fill={cor} mask={`url(#${id})`} />

      {tipo === "VOZ" && (
        <path data-gc="perfil.icone-de-status.path"
          d="M13.5 6.8 10 9.8H7.6a.9.9 0 0 0-.9.9v2.6c0 .5.4.9.9.9H10l3.5 3a.6.6 0 0 0 1-.5V7.3a.6.6 0 0 0-1-.5Zm2.9 1.9a.85.85 0 0 0-.2 1.2 3.6 3.6 0 0 1 0 4.2.85.85 0 1 0 1.4 1 5.3 5.3 0 0 0 0-6.2.85.85 0 0 0-1.2-.2Z"
          fill="white"
        />
      )}
    </svg>
  );
};
