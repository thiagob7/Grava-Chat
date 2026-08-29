import os from "node:os";
import { readFile, statfs } from "node:fs/promises";
import type { FastifyInstance } from "fastify";

import { env } from "~/env.js";
import { ehAdmin } from "~/lib/serialize.js";
import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { io } from "~/realtime/io.js";
import { authService } from "~/services/auth-service.js";
import { voiceService } from "~/services/voice-service.js";

/*
  Painel de servidor: carga da máquina, estado do banco e quem está em chamada.

  Fica atrás de autenticação E da lista de administradores. Esconder o botão no
  front não protege nada — a rota é que precisa recusar, porque qualquer pessoa
  pode chamar a URL direto, como você mesmo fez com /api/health no navegador.
*/

/// Cronometra a checagem além de dizer se passou. Banco "no ar" respondendo em
/// 900 ms é um problema; sem o número, o painel jura que está tudo bem.
async function medir(nome: string, tarefa: () => Promise<unknown>) {
  const comeco = performance.now();

  try {
    await tarefa();
    return { nome, estado: "up" as const, ms: Math.round(performance.now() - comeco) };
  } catch {
    return { nome, estado: "down" as const, ms: Math.round(performance.now() - comeco) };
  }
}

/*
  Memória de verdade, não a do `os.freemem()`.

  No Linux "livre" é só o que ninguém encostou; o kernel usa quase toda a sobra
  de cache de disco e devolve na hora que alguém precisa. Numa VM de 1 GB isso
  é a diferença entre o painel gritar "94% cheia" e a máquina estar folgada.
  `MemAvailable` é a conta que o próprio kernel faz do que dá pra entregar.
*/
async function memoria() {
  const total = os.totalmem();
  const livre = os.freemem();

  try {
    const meminfo = await readFile("/proc/meminfo", "utf8");
    const disponivel = /MemAvailable:\s+(\d+) kB/.exec(meminfo);

    if (disponivel) return { total, livre, disponivel: Number(disponivel[1]) * 1024 };
  } catch {
    /* não é Linux, ou /proc não está montado: o número do os já serve */
  }

  return { total, livre, disponivel: livre };
}

/// Disco cheio derruba Mongo, Redis e log de uma vez só, e é a falha que mais
/// pega VM pequena de sobra — vale mais que metade dos outros números daqui.
async function disco() {
  try {
    const fs = await statfs("/");
    const total = Number(fs.blocks) * Number(fs.bsize);

    return { total, livre: Number(fs.bavail) * Number(fs.bsize) };
  } catch {
    return null;
  }
}

/*
  Quem está pendurado no gateway agora.

  Conexão não é pessoa: a mesma pessoa com o app aberto no desktop e no
  navegador conta duas, e a diferença entre os dois números é o que explica um
  "500 conexões" que na verdade são 40 pessoas com abas demais.
*/
function gateway() {
  try {
    const servidor = io();
    const sockets = [...servidor.sockets.sockets.values()];

    return {
      conexoes: servidor.engine.clientsCount,
      pessoas: new Set(sockets.filter((s) => !s.data.ehBot).map((s) => s.data.userId)).size,
      bots: sockets.filter((s) => s.data.ehBot).length,
    };
  } catch {
    /// Só acontece se a rota responder antes do socket subir; não é motivo pra
    /// derrubar o painel inteiro.
    return null;
  }
}

export async function statusRoutes(app: FastifyInstance) {
  app.addHook("preHandler", app.authenticate);

  app.get("/status", async (req, reply) => {
    const user = await authService.requireUser(req.userId);
    if (!ehAdmin(user.email)) return reply.notFound();

    const [db, cache, salas, ram, hd] = await Promise.all([
      medir("mongo", () => prisma.$runCommandRaw({ ping: 1 })),
      medir("redis", () => redis.ping()),
      voiceService.estadoDoSfu().catch(() => null),
      memoria(),
      disco(),
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
        memoria: ram,
        /// Quanto da RAM é o processo da API, e não "o sistema": é o número que
        /// diz se somos nós que estamos vazando ou o vizinho de VM.
        residente: process.memoryUsage.rss(),
        disco: hd,
        uptimeDoProcesso: Math.round(process.uptime()),
        uptimeDaMaquina: Math.round(os.uptime()),
        node: process.version,
      },
      gateway: gateway(),
      mongo: db,
      redis: cache,
      sfu: salas ?? {
        indisponivel: true as const,
        salas: [],
        participantes: 0,
        publicando: 0,
        fantasmas: [],
      },
    };
  });
}
