import type { CSSProperties } from "react";

import { avatarColor } from "~/lib/format";

const TEXTURE =
  "repeating-linear-gradient(115deg, rgb(255 255 255 / 0.06) 0 1px, transparent 1px 16px)";

export function coverGenerated(id: string): CSSProperties {
  const color = avatarColor(id);

  return {
    backgroundColor: color,
    backgroundImage: [
      TEXTURE,
      `radial-gradient(120% 140% at 78% -10%, color-mix(in oklab, ${color} 55%, white), transparent 58%)`,
      `radial-gradient(90% 110% at 8% 110%, color-mix(in oklab, ${color} 60%, black), transparent 62%)`,
      `linear-gradient(155deg, color-mix(in oklab, ${color} 88%, black), color-mix(in oklab, ${color} 52%, black))`,
    ].join(", "),
  };
}
