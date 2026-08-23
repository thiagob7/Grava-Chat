import { z } from "zod";
import { ESTILOS_DE_CARGO, objectId, PERMISSIONS } from "@gravae/shared";
import { r2Url } from "./auth.js";

const permissionList = z.array(z.enum(PERMISSIONS));
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

/** Enfeites do cargo — os mesmos em criar e editar. */
const enfeitesDoCargo = {
  color: hexColor.nullable().optional(),
  /** segunda cor; so o gradiente usa */
  colorSecondary: hexColor.nullable().optional(),
  estilo: z.enum(ESTILOS_DE_CARGO).optional(),
  /**
   * Icone: emoji OU imagem, nunca os dois — e quem resolve isso e o service.
   *
   * Um `.refine()` aqui nao serve porque o PATCH e PARCIAL: mandar so o emoji
   * seria recusado por "falta imagem", e trocar um pelo outro exigiria mandar os
   * dois. O validador nao enxerga o estado atual; o service enxerga.
   */
  iconEmoji: z.string().max(64).nullable().optional(),
  iconUrl: r2Url.nullable().optional(),
};

export const createRoleInput = z.object({
  name: z.string().min(1).max(48),
  permissions: permissionList.optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
  ...enfeitesDoCargo,
});
export type CreateRoleInput = z.infer<typeof createRoleInput>;

export const updateRoleInput = z.object({
  name: z.string().min(1).max(48).optional(),
  permissions: permissionList.optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
  ...enfeitesDoCargo,
});
export type UpdateRoleInput = z.infer<typeof updateRoleInput>;

/** Arrastar para reordenar manda a lista inteira: uma posição só nunca fecha a conta. */
export const reorderRolesInput = z.object({
  roles: z.array(z.object({ id: objectId, position: z.number().int().min(1) })).min(1),
});
export type ReorderRolesInput = z.infer<typeof reorderRolesInput>;

export const setMemberRolesInput = z.object({ roleIds: z.array(objectId) });
export type SetMemberRolesInput = z.infer<typeof setMemberRolesInput>;

export const setOverwriteInput = z.object({
  type: z.enum(["ROLE", "MEMBER"]),
  allow: permissionList,
  deny: permissionList,
});
export type SetOverwriteInput = z.infer<typeof setOverwriteInput>;
