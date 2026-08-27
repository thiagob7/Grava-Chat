import os from "node:os";
import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { ehAdmin } from "~/lib/serialize.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { authService } from "~/services/auth-service.js";
import { voiceService } from "~/services/voice-service.js";

/*
  Painel de servidor: carga da máquina, estado do banco e quem está em chamada.

  Fica atrás de autenticação E da lista de administradores. Esconder o botão no
  front não protege nada — a rota é que precisa recusar, porque qualquer pessoa
  pode chamar a URL direto, como você mesmo fez com /api/health no navegador.
*/
export async function statusRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/status", async (req, reply) => {
    const user = await authService.requireUser(req.userId);
    if (!ehAdmin(user.email)) return reply.notFound();

    const [db, cache, salas] = await Promise.allSettled([
      prisma.$runCommandRaw({ ping: 1 }),
      redis.ping(),
      voiceService.estadoDoSfu(),
    ]);

    /*
      A carga do Linux é uma média móvel de processos esperando CPU, não uma
      porcentagem: 1.0 em máquina de 2 threads é metade ocupada, não 100%.
      Mando os dois números pra tela não ter que adivinhar o divisor.
    */
    const [c1, c5, c15] = os.loadavg();

    return {
      api: {
        /*
          Identidade da máquina no topo: em desenvolvimento estes números são os
          do computador de quem programa, não os do servidor. Sem dizer isso, o
          painel mostra 8 threads e 8 GB e a pessoa acha que a VM cresceu.
        */
        host: os.hostname(),
        ambiente: env.NODE_ENV,
        carga: { um: c1, cinco: c5, quinze: c15 },
        nucleos: os.cpus().length,
        memoria: { total: os.totalmem(), livre: os.freemem() },
        uptimeDoProcesso: Math.round(process.uptime()),
        uptimeDaMaquina: Math.round(os.uptime()),
      },
      mongo: db.status === "fulfilled" ? "up" : "down",
      redis: cache.status === "fulfilled" ? "up" : "down",
      sfu:
        salas.status === "fulfilled"
          ? salas.value
          : { indisponivel: true as const, salas: [], participantes: 0 },
    };
  });
}
