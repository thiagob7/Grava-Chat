import React, { useId } from "react";
import type { PresenceStatus } from "@gravae/shared";

export type StatusKind = PresenceStatus;

export const StatusIcon: React.FC<{
  kind: StatusKind;
  size: number;
  className?: string;
}> = ({ kind, size, className }) => {
  const id = `status${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const color =
    kind === "ONLINE"
      ? "var(--color-online)"
      : kind === "IDLE"
        ? "var(--color-idle)"
        : kind === "DND"
          ? "var(--color-dnd)"
          : "var(--color-ink-faint)";

  return (
    <svg data-gc="perfil.icone-de-status.svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <defs data-gc="perfil.icone-de-status.defs">
        <mask data-gc="perfil.icone-de-status.mask" id={id}>
          <circle data-gc="perfil.icone-de-status.circle" cx="12" cy="12" r="12" fill="white" />

          {kind === "IDLE" && <circle data-gc="perfil.icone-de-status.circle--2" cx="5" cy="5" r="10" fill="black" />}

          {kind === "DND" && <rect data-gc="perfil.icone-de-status.rect" x="4" y="9.5" width="16" height="5" rx="2.5" fill="black" />}

          {kind === "OFFLINE" && <circle data-gc="perfil.icone-de-status.circle--3" cx="12" cy="12" r="6" fill="black" />}
        </mask>
      </defs>

      <circle data-gc="perfil.icone-de-status.circle--4" cx="12" cy="12" r="12" fill={color} mask={`url(#${id})`} />
    </svg>
  );
};
