import type { FastifyRequest } from "fastify";

export function baseUrlDe(req: FastifyRequest) {
  const host = (req.headers["x-forwarded-host"] as string) ?? req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] as string) ?? req.protocol;

  return `${proto}://${host}`;
}
