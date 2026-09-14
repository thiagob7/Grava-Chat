import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import type { FastifyRequest } from "fastify";

import { env } from "~/env.js";

export const EDGE_HEADER = "x-gravae-borda";

const header = (req: FastifyRequest, name: string) => {
  const value = req.headers[name];
  return Array.isArray(value) ? value[0] : value;
};

const fromEdge = (req: FastifyRequest) => {
  const given = header(req, EDGE_HEADER);
  if (!env.EDGE_SECRET || !given) return false;

  const a = Buffer.from(given);
  const b = Buffer.from(env.EDGE_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
};

export function clientIp(req: FastifyRequest): string {
  if (!fromEdge(req)) return req.ip;

  const forwarded = header(req, "x-vercel-forwarded-for") ?? header(req, "x-real-ip");
  const first = forwarded?.split(",")[0]?.trim();

  return first && isIP(first) ? first : req.ip;
}
