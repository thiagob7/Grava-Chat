import type { Role } from "@gravae/shared";

import { readable } from "./contraste";
import { charmVariables } from "./estilos";
import type { Charm } from "./nome";

export function roleMoreHighColor(roleIds: string[], roles: Role[]): string | null {
  const mine = new Set(roleIds);

  return colorMoreHigh(roles.filter((r) => mine.has(r.id)));
}

export function colorMoreHigh(roleList: Role[]): string | null {
  return (
    roleList
      .filter((r) => r.color)
      .sort((a, b) => b.position - a.position)[0]?.color ?? null
  );
}

export function rolePaints(roleIds: string[], roles: Role[]): Role | null {
  const mine = new Set(roleIds);

  return (
    roles
      .filter((r) => mine.has(r.id) && (r.color || r.iconUrl || r.iconEmoji))
      .sort((a, b) => b.position - a.position)[0] ?? null
  );
}

interface RoleOptions {
  size?: "sm" | "md";
  animate?: boolean;
  background?: string;
}

export function roleStyle(
  role: Pick<Role, "color" | "colorSecondary" | "style">,
  { size = "sm", animate = false, background }: RoleOptions = {},
): Charm {
  const color = role.color ? readable(role.color, background) : null;
  const color2 = role.colorSecondary ? readable(role.colorSecondary, background) : null;

  const request = role.style ?? "solido";
  const style =
    (request === "gradiente" && (!color2 || size === "sm")) || request === "solido"
      ? "solido"
      : request;

  if (style === "solido") {
    return color ? { style: { color: color } } : {};
  }

  return {
    className: `gc-cargo--${style}`,
    style: charmVariables({ color1: color, color2, animate }),
  };
}
