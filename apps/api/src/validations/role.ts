import { z } from "zod";
import { objectId, PERMISSIONS } from "@gravae/shared";

const permissionList = z.array(z.enum(PERMISSIONS));
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

export const createRoleInput = z.object({
  name: z.string().min(1).max(48),
  color: hexColor.nullable().optional(),
  permissions: permissionList.optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
});
export type CreateRoleInput = z.infer<typeof createRoleInput>;

export const updateRoleInput = z.object({
  name: z.string().min(1).max(48).optional(),
  color: hexColor.nullable().optional(),
  permissions: permissionList.optional(),
  hoist: z.boolean().optional(),
  mentionable: z.boolean().optional(),
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
