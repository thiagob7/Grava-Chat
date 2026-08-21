import React from "react";

interface ServerTagProps {
  tag: string | null | undefined;
  icone?: string | null;
}

/** A etiqueta do servidor ao lado do nome de quem é membro. */
export const ServerTag: React.FC<ServerTagProps> = ({ tag, icone }) => {
  if (!tag) return null;

  return (
    <span className="flex shrink-0 items-center gap-0.5 rounded bg-brand/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
      {icone} {tag}
    </span>
  );
};
