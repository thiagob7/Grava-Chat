import type { Role } from "@gravae/shared";

import { legivel } from "./contraste";
import { variaveisDoEnfeite } from "./estilos";
import type { Enfeite } from "./nome";

export function corDoCargoMaisAlto(roleIds: string[], roles: Role[]): string | null {
  const meus = new Set(roleIds);

  return corMaisAlta(roles.filter((r) => meus.has(r.id)));
}

export function corMaisAlta(cargos: Role[]): string | null {
  return (
    cargos
      .filter((r) => r.color)
      .sort((a, b) => b.position - a.position)[0]?.color ?? null
  );
}

export function cargoQuePinta(roleIds: string[], roles: Role[]): Role | null {
  const meus = new Set(roleIds);

  return (
    roles
      .filter((r) => meus.has(r.id) && (r.color || r.iconUrl || r.iconEmoji))
      .sort((a, b) => b.position - a.position)[0] ?? null
  );
}

interface OpcoesDoCargo {
  tamanho?: "sm" | "md";
  animar?: boolean;
  fundo?: string;
}

export function estiloDoCargo(
  cargo: Pick<Role, "color" | "colorSecondary" | "estilo">,
  { tamanho = "sm", animar = false, fundo }: OpcoesDoCargo = {},
): Enfeite {
  const cor = cargo.color ? legivel(cargo.color, fundo) : null;
  const cor2 = cargo.colorSecondary ? legivel(cargo.colorSecondary, fundo) : null;

  const pedido = cargo.estilo ?? "solido";
  const estilo =
    (pedido === "gradiente" && (!cor2 || tamanho === "sm")) || pedido === "solido"
      ? "solido"
      : pedido;

  if (estilo === "solido") {
    return cor ? { style: { color: cor } } : {};
  }

  return {
    className: `gc-cargo--${estilo}`,
    style: variaveisDoEnfeite({ cor1: cor, cor2, animar }),
  };
}
