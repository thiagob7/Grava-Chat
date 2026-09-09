import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const CUSTO = 16384;
const TAMANHO = 64;

function derivar(senha: string, sal: Buffer, tamanho: number, custo: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, sal, tamanho, { N: custo }, (erro, chave) => (erro ? reject(erro) : resolve(chave)));
  });
}

export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(senha, sal, TAMANHO, CUSTO);

  return `scrypt$${CUSTO}$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function conferirSenha(senha: string, guardado: string): Promise<boolean> {
  const [algoritmo, custo, sal, hash] = guardado.split("$");
  if (algoritmo !== "scrypt" || !custo || !sal || !hash) return false;

  const esperado = Buffer.from(hash, "base64");
  const calculado = await derivar(senha, Buffer.from(sal, "base64"), esperado.length, Number(custo));

  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}
