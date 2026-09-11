import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_NAMES = [/^Teste /i];

const TEST_EMAILS =
  /^(amiga|amigo|estranho|bagunceiro-|socket-[ab]|voz-[abc]|teste-|dono-|mod-|ze-|membro-|refresh-race|desktop-login|upload|redis-check|mon-check|porta-check|presence-test)/i;

const manterById = (process.env.GUILDS_MANTER ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const guilds = await prisma.guild.findMany({ select: { id: true, name: true } });

const forDelete = guilds.filter((g) => {
  if (manterById.length) return !manterById.includes(g.id);
  return TEST_NAMES.some((fallback) => fallback.test(g.name));
});

console.log(`servidores: ${guilds.length} no total, ${forDelete.length} para apagar\n`);

for (const g of forDelete) {
  await prisma.guild.delete({ where: { id: g.id } });
}

const bots = await prisma.user.findMany({ where: { isBot: true }, select: { id: true, username: true } });
let botsRemoved = 0;

for (const bot of bots) {
  if (await prisma.webhook.findUnique({ where: { botUserId: bot.id } })) continue;

  await prisma.message.deleteMany({ where: { authorId: bot.id } });
  await prisma.user.delete({ where: { id: bot.id } });
  botsRemoved++;
}

const users = await prisma.user.findMany({ select: { id: true, email: true, username: true } });
const testUsers = users.filter((u) => TEST_EMAILS.test(u.email));

for (const u of testUsers) {
  await prisma.user.delete({ where: { id: u.id } });
}

const dms = await prisma.channel.findMany({ where: { guildId: null } });
const idsLive = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
const dmsOrphans = dms.filter((c) => c.recipients.some((r) => !idsLive.has(r)));

for (const c of dmsOrphans) {
  await prisma.channel.delete({ where: { id: c.id } });
}

console.log(`apagados:`);
console.log(`  ${forDelete.length} servidor(es)`);
console.log(`  ${testUsers.length} usuário(s) de teste`);
console.log(`  ${dmsOrphans.length} conversa(s) órfã(s)`);
console.log(`  ${botsRemoved} bot(s) de webhook sem dono`);

const leftover = await prisma.guild.findMany({
  include: { _count: { select: { members: true, channels: true } } },
});

console.log(`\nsobraram ${leftover.length} servidor(es):`);
for (const g of leftover) {
  console.log(`  ${g.name} — ${g._count.members} membro(s), ${g._count.channels} canal(is)`);
}

console.log(`\nusuários: ${await prisma.user.count()} | mensagens: ${await prisma.message.count()}`);
await prisma.$disconnect();
