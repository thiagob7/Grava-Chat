import type { FastifyInstance } from "fastify";
import { rooms, objectId } from "@gravae/shared";
import { io } from "~/realtime/io.js";
import { roleService } from "~/services/role-service.js";
import { guildParams, guildChannelParams, guildMemberParams } from "~/validations/common.js";
import {
  createRoleInput,
  updateRoleInput,
  reorderRolesInput,
  setMemberRolesInput,
  setOverwriteInput,
} from "~/validations/role.js";

const roleParams = guildParams.extend({ roleId: objectId });
const overwriteParams = guildChannelParams.extend({ targetId: objectId });

/**
 * Mudar cargo ou permissão de canal muda o que cada pessoa PODE VER. Não dá pra
 * mandar o novo estado pronto, porque ele é diferente pra cada um — então o
 * servidor avisa "mudou" e cada cliente recarrega o que lhe cabe.
 */
const avisarMudanca = (guildId: string) =>
  io().to(rooms.guild(guildId)).emit("guild:refresh", { guildId });

export async function roleRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/guilds/:guildId/roles", (req) => {
    const { guildId } = guildParams.parse(req.params);
    return roleService.list(req.userId, guildId);
  });

  app.post("/guilds/:guildId/roles", async (req, reply) => {
    const { guildId } = guildParams.parse(req.params);
    const role = await roleService.create(req.userId, guildId, createRoleInput.parse(req.body));

    avisarMudanca(guildId);
    return reply.code(201).send(role);
  });

  app.patch("/guilds/:guildId/roles/:roleId", async (req) => {
    const { guildId, roleId } = roleParams.parse(req.params);
    const role = await roleService.update(req.userId, guildId, roleId, updateRoleInput.parse(req.body));

    avisarMudanca(guildId);
    return role;
  });

  app.delete("/guilds/:guildId/roles/:roleId", async (req, reply) => {
    const { guildId, roleId } = roleParams.parse(req.params);
    await roleService.remove(req.userId, guildId, roleId);

    avisarMudanca(guildId);
    return reply.code(204).send();
  });

  app.patch("/guilds/:guildId/roles", async (req) => {
    const { guildId } = guildParams.parse(req.params);
    const roles = await roleService.reorder(req.userId, guildId, reorderRolesInput.parse(req.body));

    avisarMudanca(guildId);
    return roles;
  });

  app.patch("/guilds/:guildId/members/:userId/roles", async (req) => {
    const { guildId, userId } = guildMemberParams.parse(req.params);
    const member = await roleService.setMemberRoles(
      req.userId,
      guildId,
      userId,
      setMemberRolesInput.parse(req.body),
    );

    io().to(rooms.guild(guildId)).emit("member:updated", member);
    // quem ganhou ou perdeu cargo pode ter ganhado ou perdido canais
    io().to(rooms.user(userId)).emit("guild:refresh", { guildId });

    return member;
  });

  app.get("/guilds/:guildId/channels/:channelId/permissions", (req) => {
    const { guildId, channelId } = guildChannelParams.parse(req.params);
    return roleService.listOverwrites(req.userId, guildId, channelId);
  });

  app.put("/guilds/:guildId/channels/:channelId/permissions/:targetId", async (req) => {
    const { guildId, channelId, targetId } = overwriteParams.parse(req.params);
    const overwrite = await roleService.setOverwrite(
      req.userId,
      guildId,
      channelId,
      targetId,
      setOverwriteInput.parse(req.body),
    );

    avisarMudanca(guildId);
    return overwrite ?? { removed: true };
  });

  app.delete("/guilds/:guildId/channels/:channelId/permissions/:targetId", async (req, reply) => {
    const { guildId, channelId, targetId } = overwriteParams.parse(req.params);
    await roleService.removeOverwrite(req.userId, guildId, channelId, targetId);

    avisarMudanca(guildId);
    return reply.code(204).send();
  });
}
