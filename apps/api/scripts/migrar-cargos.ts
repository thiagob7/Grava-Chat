import { PrismaClient } from "@prisma/client";
import { DEFAULT_EVERYONE_PERMISSIONS } from "@gravae/shared";

const prisma = new PrismaClient();

const old = (await prisma.guildMember.aggregateRaw({
  pipeline: [{ $match: { role: { $exists: true } } }, { $project: { _id: 1, role: 1 } }],
})) as unknown as { _id: { $oid: string } | string; role: string }[];

const oid = (v: { $oid: string } | string) => (typeof v === "string" ? v : v.$oid);
const oldRole = new Map(old.map((m) => [oid(m._id), m.role]));

console.log(`${oldRole.size} membro(s) com papel antigo\n`);

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

  const wereAdmin = guild.members.filter((m) => oldRole.get(m.id) === "ADMIN");

  if (wereAdmin.length) {
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

    for (const member of wereAdmin) {
      if (member.roleIds.includes(admin.id)) continue;
      await prisma.guildMember.update({
        where: { id: member.id },
        data: { roleIds: { push: admin.id } },
      });
    }

    console.log(`  ${guild.name}: cargo Admin para ${wereAdmin.length} pessoa(s)`);
  }
}

const totalRoles = await prisma.role.count();
console.log(`\n${guilds.length} servidor(es) migrado(s), ${totalRoles} cargo(s) no total`);
await prisma.$disconnect();
