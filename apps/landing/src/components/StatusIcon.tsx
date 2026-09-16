export type StatusKind = "online" | "idle" | "dnd" | "offline";

const COLOR: Record<StatusKind, string> = {
  online: "var(--color-online)",
  idle: "var(--color-idle)",
  dnd: "var(--color-dnd)",
  offline: "var(--color-ink-faint)",
};

export const StatusIcon = ({
  kind,
  uid,
  size = 10,
  className = "",
}: {
  kind: StatusKind;
  uid: string;
  size?: number;
  className?: string;
}) => {
  const id = `status-${uid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <mask id={id}>
          <circle cx="12" cy="12" r="12" fill="white" />
          {kind === "idle" && <circle cx="5" cy="5" r="10" fill="black" />}
          {kind === "dnd" && <rect x="4" y="9.5" width="16" height="5" rx="2.5" fill="black" />}
          {kind === "offline" && <circle cx="12" cy="12" r="6" fill="black" />}
        </mask>
      </defs>
      <circle cx="12" cy="12" r="12" fill={COLOR[kind]} mask={`url(#${id})`} />
    </svg>
  );
};
