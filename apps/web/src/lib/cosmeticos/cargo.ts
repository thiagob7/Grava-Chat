/**
 * O cargo pintado, e a cor que ele empresta ao nome de quem o tem.
 *
 * A cor do cargo hoje é aplicada crua — um roxo fechado escolhido por alguém
 * vira nome ilegível no fundo escuro, e a culpa parece do app. Tudo que sai
 * daqui passa pelo piso de contraste.
 */
import type { Role } from "@gravae/shared";

import { legivel } from "./contraste";
import { variaveisDoEnfeite } from "./estilos";
import type { Enfeite } from "./nome";

/**
 * A cor do nome vem do cargo mais alto que TEM cor — cargo sem cor não pinta,
 * e a busca continua para o de baixo.
 *
 * Era uma função privada da `MemberList`, e é exatamente por isso que a cor do
 * cargo nunca apareceu no chat, apesar de o editor de cargos prometer "na lista
 * de membros **e no chat**" há tempo. Aqui ela é de todo mundo.
 */
export function corDoCargoMaisAlto(roleIds: string[], roles: Role[]): string | null {
  const meus = new Set(roleIds);

  return corMaisAlta(roles.filter((r) => meus.has(r.id)));
}

/** A mesma coisa para quem já tem em mãos só os cargos da pessoa. */
export function corMaisAlta(cargos: Role[]): string | null {
  return (
    cargos
      .filter((r) => r.color)
      .sort((a, b) => b.position - a.position)[0]?.color ?? null
  );
}

/** O cargo mais alto que tem QUALQUER enfeite — cor, gradiente ou ícone. */
export function cargoQuePinta(roleIds: string[], roles: Role[]): Role | null {
  const meus = new Set(roleIds);

  return (
    roles
      .filter((r) => meus.has(r.id) && (r.color || r.iconUrl || r.iconEmoji))
      .sort((a, b) => b.position - a.position)[0] ?? null
  );
}

interface OpcoesDoCargo {
  /** `sm` recusa gradiente; ver o porquê em `nome.ts` */
  tamanho?: "sm" | "md";
  animar?: boolean;
  fundo?: string;
}

/**
 * Como o NOME DO CARGO é pintado (na aba de cargos, na seção da lista de
 * membros, na etiqueta).
 *
 * `gradiente` sem segunda cor cai para sólido em vez de sumir: o PATCH do
 * editor é parcial e pode mandar o estilo antes da cor, e uma tela em branco
 * nesse meio-tempo pareceria bug.
 */
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
