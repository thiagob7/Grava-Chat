import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

const COST = 16384;
const SIZE = 64;

function derive(password: string, sal: Buffer, size: number, cost: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, sal, size, { N: cost }, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

export async function generateHash(password: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derive(password, sal, SIZE, COST);

  return `scrypt$${COST}$${sal.toString("base64")}$${hash.toString("base64")}`;
}

export async function checkPassword(password: string, kept: string): Promise<boolean> {
  const [algorithm, cost, sal, hash] = kept.split("$");
  if (algorithm !== "scrypt" || !cost || !sal || !hash) return false;

  const expected = Buffer.from(hash, "base64");
  const computed = await derive(password, Buffer.from(sal, "base64"), expected.length, Number(cost));

  return computed.length === expected.length && timingSafeEqual(computed, expected);
}
