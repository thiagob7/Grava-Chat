import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const NOMES_DE_TESTE = [/^Teste /i];

const EMAILS_DE_TESTE =
  /^(amiga|amigo|estranho|bagunceiro-|socket-[ab]|voz-[abc]|teste-|dono-|mod-|ze-|membro-|refresh-race|desktop-login|upload|redis-check|mon-check|porta-check|presence-test)/i;

const manterPorId = (process.env.GUILDS_MANTER ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const guilds = await prisma.guild.findMany({ select: { id: true, name: true } });

const paraApagar = guilds.filter((g) => {
  if (manterPorId.length) return !manterPorId.includes(g.id);
  return NOMES_DE_TESTE.some((padrao) => padrao.test(g.name));
});

console.log(`servidores: ${guilds.length} no total, ${paraApagar.length} para apagar\n`);

for (const g of paraApagar) {
  await prisma.guild.delete({ where: { id: g.id } });
}

const bots = await prisma.user.findMany({ where: { isBot: true }, select: { id: true, username: true } });
let botsRemovidos = 0;

for (const bot of bots) {
  if (await prisma.webhook.findUnique({ where: { botUserId: bot.id } })) continue;

  await prisma.message.deleteMany({ where: { authorId: bot.id } });
  await prisma.user.delete({ where: { id: bot.id } });
  botsRemovidos++;
}

const usuarios = await prisma.user.findMany({ select: { id: true, email: true, username: true } });
const usuariosDeTeste = usuarios.filter((u) => EMAILS_DE_TESTE.test(u.email));

for (const u of usuariosDeTeste) {
  await prisma.user.delete({ where: { id: u.id } });
}

const dms = await prisma.channel.findMany({ where: { guildId: null } });
const idsVivos = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));
const dmsOrfas = dms.filter((c) => c.recipients.some((r) => !idsVivos.has(r)));

for (const c of dmsOrfas) {
  await prisma.channel.delete({ where: { id: c.id } });
}

console.log(`apagados:`);
console.log(`  ${paraApagar.length} servidor(es)`);
console.log(`  ${usuariosDeTeste.length} usuário(s) de teste`);
console.log(`  ${dmsOrfas.length} conversa(s) órfã(s)`);
console.log(`  ${botsRemovidos} bot(s) de webhook sem dono`);

const sobraram = await prisma.guild.findMany({
  include: { _count: { select: { members: true, channels: true } } },
});

console.log(`\nsobraram ${sobraram.length} servidor(es):`);
for (const g of sobraram) {
  console.log(`  ${g.name} — ${g._count.members} membro(s), ${g._count.channels} canal(is)`);
}

console.log(`\nusuários: ${await prisma.user.count()} | mensagens: ${await prisma.message.count()}`);
await prisma.$disconnect();
