import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const resultado = (await prisma.$runCommandRaw({
  update: "User",
  updates: [{ q: { isBot: { $exists: false } }, u: { $set: { isBot: false } }, multi: true }],
})) as unknown as { n?: number; nModified?: number };

const encontrados = resultado.n ?? 0;
const alterados = resultado.nModified ?? 0;

console.log(`${encontrados} usuário(s) sem o campo; ${alterados} preenchido(s).`);

const restantes = (await prisma.user.aggregateRaw({
  pipeline: [{ $match: { isBot: { $exists: false } } }, { $count: "total" }],
})) as unknown as { total: number }[];

const sobraram = restantes[0]?.total ?? 0;
console.log(sobraram === 0 ? "Nenhum documento sem o campo." : `AINDA sobraram ${sobraram}.`);

await prisma.$disconnect();
