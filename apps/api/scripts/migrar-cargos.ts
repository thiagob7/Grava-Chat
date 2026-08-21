/**
 * Migra do modelo antigo (enum OWNER/ADMIN/MEMBER em GuildMember.role) para
 * cargos de verdade.
 *
 * Para cada servidor: cria o @everyone com as permissões de membro comum e,
 * se houver alguém que era ADMIN, um cargo "Admin" com ADMINISTRATOR.
 *
 * Idempotente — rodar duas vezes não duplica nada.
 * Uso: yarn workspace @gravae/api migrar-cargos
 */
import { PrismaClient } from "@prisma/client";
import { DEFAULT_EVERYONE_PERMISSIONS } from "@gravae/shared";

const prisma = new PrismaClient();

/**
 * O campo `role` não existe mais no schema do Prisma, mas os documentos antigos
 * ainda o têm no Mongo. Só dá para ler por consulta crua.
 */
const antigos = (await prisma.guildMember.aggregateRaw({
  pipeline: [{ $match: { role: { $exists: true } } }, { $project: { _id: 1, role: 1 } }],
})) as unknown as { _id: { $oid: string } | string; role: string }[];

const oid = (v: { $oid: string } | string) => (typeof v === "string" ? v : v.$oid);
const papelAntigo = new Map(antigos.map((m) => [oid(m._id), m.role]));

console.log(`${papelAntigo.size} membro(s) com papel antigo\n`);

const guilds = await prisma.guild.findMany({ include: { members: true } });

for (const guild of guilds) {
  let everyone = await prisma.role.findFirst({ where: { guildId: guild.id, isEveryone: true } });

  if (!everyone) {
    everyone = await prisma.role.create({
      data: {
        guildId: guild.id,
        name: "@everyone",
        position: 0,
        permissions: DEFAULT_EVERYONE_PERMISSIONS,
        isEveryone: true,
      },
    });
    console.log(`  ${guild.name}: @everyone criado`);
  }

  const eramAdmin = guild.members.filter((m) => papelAntigo.get(m.id) === "ADMIN");

  if (eramAdmin.length) {
    let admin = await prisma.role.findFirst({
      where: { guildId: guild.id, name: "Admin", isEveryone: false },
    });

    admin ??= await prisma.role.create({
      data: {
        guildId: guild.id,
        name: "Admin",
        color: "#f23f43",
        position: 1,
        permissions: ["ADMINISTRATOR"],
        hoist: true,
      },
    });

    for (const membro of eramAdmin) {
      if (membro.roleIds.includes(admin.id)) continue;
      await prisma.guildMember.update({
        where: { id: membro.id },
        data: { roleIds: { push: admin.id } },
      });
    }

    console.log(`  ${guild.name}: cargo Admin para ${eramAdmin.length} pessoa(s)`);
  }
}

const totalCargos = await prisma.role.count();
console.log(`\n${guilds.length} servidor(es) migrado(s), ${totalCargos} cargo(s) no total`);
await prisma.$disconnect();
