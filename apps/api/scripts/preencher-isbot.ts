import { PrismaClient } from "@prisma/client";

/**
 * Preenche `isBot: false` em quem foi cadastrado antes do campo existir.
 *
 * `@default(false)` no schema do Prisma vale na ESCRITA — ele não volta e
 * preenche documento antigo. E no conector do Mongo, documento SEM o campo não
 * casa com `isBot: false`; nem com `NOT: { isBot: true }`, que parece
 * equivalente e não é (testado: os dois devolvem null).
 *
 * O efeito era invisível e cruel: a busca por nome de usuário do pedido de
 * amizade filtra `isBot: false`, então quem se cadastrou antes dos bots
 * existirem simplesmente não era encontrado por ninguém — e a mensagem dizia
 * "não achei ninguém com esse nome de usuário", como se quem procurava tivesse
 * errado a digitação.
 *
 * Idempotente: roda quantas vezes quiser, só toca em quem está sem o campo.
 */
const prisma = new PrismaClient();

/*
  `updateMany` do Prisma não sabe consultar por campo ausente — é a mesma
  limitação que criou o problema. Daí o comando cru: `$exists: false` é do
  Mongo, e é o único jeito de alcançar esses documentos.
*/
const resultado = (await prisma.$runCommandRaw({
  update: "User",
  updates: [{ q: { isBot: { $exists: false } }, u: { $set: { isBot: false } }, multi: true }],
})) as unknown as { n?: number; nModified?: number };

const encontrados = resultado.n ?? 0;
const alterados = resultado.nModified ?? 0;

console.log(`${encontrados} usuário(s) sem o campo; ${alterados} preenchido(s).`);

/// Confere o resultado em vez de confiar no retorno do comando.
const restantes = (await prisma.user.aggregateRaw({
  pipeline: [{ $match: { isBot: { $exists: false } } }, { $count: "total" }],
})) as unknown as { total: number }[];

const sobraram = restantes[0]?.total ?? 0;
console.log(sobraram === 0 ? "Nenhum documento sem o campo." : `AINDA sobraram ${sobraram}.`);

await prisma.$disconnect();
