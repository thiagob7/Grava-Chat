import type { ReactNode } from "react";

export const Hint = ({ label, children }: { label: string; children: ReactNode }) => (
  <span className="group/hint relative flex">
    {children}
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-x-1 -translate-y-1/2 whitespace-nowrap rounded-md border border-line bg-surface-4 px-2.5 py-[7px] text-xs font-medium text-ink opacity-0 shadow-[0_0.5rem_1rem_rgba(0,0,0,0.22)] transition duration-150 group-hover/hint:translate-x-0 group-hover/hint:opacity-100"
    >
      {label}
      <span className="absolute right-full top-1/2 size-2 -translate-y-1/2 translate-x-1 rotate-45 border-b border-l border-line bg-surface-4" />
    </span>
  </span>
);
