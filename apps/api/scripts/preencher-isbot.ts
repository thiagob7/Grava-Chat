import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const result = (await prisma.$runCommandRaw({
  update: "User",
  updates: [{ q: { isBot: { $exists: false } }, u: { $set: { isBot: false } }, multi: true }],
})) as unknown as { n?: number; nModified?: number };

const found = result.n ?? 0;
const changed = result.nModified ?? 0;

console.log(`${found} usuário(s) sem o campo; ${changed} preenchido(s).`);

const remaining = (await prisma.user.aggregateRaw({
  pipeline: [{ $match: { isBot: { $exists: false } } }, { $count: "total" }],
})) as unknown as { total: number }[];

const leftover = remaining[0]?.total ?? 0;
console.log(leftover === 0 ? "Nenhum documento sem o campo." : `AINDA sobraram ${leftover}.`);

await prisma.$disconnect();
