import React from "react";

import { cn } from "~/lib/utils";

export interface GroupFace {
  id: string;
  name: string;
  url?: string | null;
}

interface AvatarsPropsGroup {
  faces: GroupFace[];
  until?: number;
  size?: number;
  ring?: string;
  className?: string;
}

export const AvatarsGroup: React.FC<AvatarsPropsGroup> = ({
  faces,
  until = 3,
  size = 24,
  ring = "ring-surface-2",
  className,
}) => {
  const shown = faces.slice(0, until);
  const leftover = faces.length - shown.length;

  const measure = { width: size, height: size };
  const font = { fontSize: Math.max(9, Math.round(size * 0.38)) };

  return (
    <span data-gc="ui.grupo-de-avatares.span" className={cn("flex shrink-0 -space-x-2", className)}>
      {shown.map((face) => (
        <span data-gc="ui.grupo-de-avatares.span--2"
          key={face.id}
          title={face.name}
          style={measure}
          className={cn("overflow-hidden rounded-full ring-2", ring)}
        >
          {face.url ? (
            <img data-gc="ui.grupo-de-avatares.img"
              src={face.url}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <span data-gc="ui.grupo-de-avatares.span--3"
              style={font}
              className="flex size-full items-center justify-center bg-surface-4 font-semibold uppercase text-ink-muted"
            >
              {face.name.slice(0, 2)}
            </span>
          )}
        </span>
      ))}

      {leftover > 0 && (
        <span data-gc="ui.grupo-de-avatares.span--4"
          style={{ ...measure, ...font }}
          className={cn(
            "flex items-center justify-center rounded-full bg-surface-4 font-semibold text-ink-muted ring-2",
            ring,
          )}
        >
          +{leftover}
        </span>
      )}
    </span>
  );
};
