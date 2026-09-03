import type { FastifyBaseLogger } from "fastify";

import { prisma } from "~/lib/prisma.js";
import { redis } from "~/lib/redis.js";
import { voiceService } from "~/services/voice-service.js";

/*
  O histórico de status: quem mede, quem grava e quem resume.

  Separado do `routes/status.ts`, que é o painel de administrador com carga de
  máquina e memória. Aquele responde "como está a VM agora" para quem
  administra; este responde "a plataforma esteve no ar" para qualquer pessoa —
  dados diferentes, públicos diferentes, e nada em comum além da palavra.
*/

/// As peças que a página de status mostra. A ordem é a que aparece na tela.
export const PECAS = ["api", "banco", "cache", "sfu"] as const;
export type Peca = (typeof PECAS)[number];

/*
  Um minuto entre medições.

  Mais rápido não melhora a barrinha do dia — ela mostra porcentagem, e 1.440
  amostras já dão resolução de 0,07%. Mais devagar deixa passar queda curta,
  que é justamente a que ninguém percebe sem histórico.
*/
const INTERVALO_MS = 60_000;

/// A primeira medição espera o servidor terminar de subir. Medir no instante
/// zero registraria como "queda" o Redis que ainda está abrindo a conexão.
const ATRASO_INICIAL_MS = 15_000;

/// Noventa dias é o que a página desenha. Guardar mais é guardar o que ninguém
/// vai olhar, num banco de 512 MB.
export const DIAS_GUARDADOS = 90;

export interface Medida {
  peca: Peca;
  estado: "up" | "down";
  ms: number;
}

/*
  O dia em UTC, e não no fuso de quem pergunta.

  O balde precisa ser o mesmo para todo mundo: com fuso local, quem abre a
  página no Japão e quem abre no Brasil veriam a mesma queda em dias
  diferentes, e a soma de dois visitantes nunca fecharia.
*/
export const diaUtc = (quando = new Date()) => quando.toISOString().slice(0, 10);

async function medir(peca: Peca, tarefa: () => Promise<unknown>): Promise<Medida> {
  const comeco = performance.now();

  try {
    await tarefa();
    return { peca, estado: "up", ms: Math.round(performance.now() - comeco) };
  } catch {
    return { peca, estado: "down", ms: Math.round(performance.now() - comeco) };
  }
}

/**
 * O estado de agora, medido na hora.
 *
 * A "api" não tem o que medir de fora: se este código está rodando, ela está
 * no ar. Ela entra na lista mesmo assim, com o tempo em zero, porque a página
 * precisa listá-la — e porque a ausência dela seria lida como peça faltando, e
 * não como peça óbvia.
 */
export async function estadoAgora(): Promise<Medida[]> {
  const [banco, cache, sfu] = await Promise.all([
    medir("banco", () => prisma.$runCommandRaw({ ping: 1 })),
    medir("cache", () => redis.ping()),
    medir("sfu", async () => {
      const estado = await voiceService.estadoDoSfu();
      if (!estado) throw new Error("sfu não respondeu");
    }),
  ]);

  return [{ peca: "api", estado: "up", ms: 0 }, banco, cache, sfu];
}

/// Soma a medição no balde do dia. `upsert` porque o primeiro minuto de cada
/// dia cria o registro e os 1.439 seguintes só incrementam.
async function gravar(medidas: Medida[]): Promise<void> {
  const dia = diaUtc();

  await Promise.all(
    medidas.map((m) =>
      prisma.statusDoDia.upsert({
        where: { peca_dia: { peca: m.peca, dia } },
        create: {
          peca: m.peca,
          dia,
          medidas: 1,
          falhas: m.estado === "down" ? 1 : 0,
          msSoma: m.ms,
        },
        update: {
          medidas: { increment: 1 },
          falhas: { increment: m.estado === "down" ? 1 : 0 },
          msSoma: { increment: m.ms },
        },
      }),
    ),
  );
}

/// Tira o que saiu da janela. Sem isto o histórico cresce para sempre, e o
/// dia 91 nunca é olhado por ninguém.
async function podar(): Promise<number> {
  const limite = new Date(Date.now() - DIAS_GUARDADOS * 24 * 60 * 60 * 1000);
  const { count } = await prisma.statusDoDia.deleteMany({
    where: { dia: { lt: diaUtc(limite) } },
  });

  return count;
}

export const statusService = {
  estadoAgora,

  /**
   * A janela de dias, já em porcentagem, com os buracos preenchidos.
   *
   * Dia sem registro nenhum não é dia com queda — é dia em que ESTE serviço não
   * estava rodando, seja porque a máquina caiu, seja porque a peça é mais nova
   * que a janela. Pintar de vermelho seria inventar uma queda que talvez não
   * tenha existido; devolver `null` deixa a página desenhar cinza e dizer a
   * verdade: não sei.
   */
  async janela(): Promise<Record<Peca, { dia: string; uptime: number | null }[]>> {
    const inicio = new Date(Date.now() - (DIAS_GUARDADOS - 1) * 24 * 60 * 60 * 1000);

    const registros = await prisma.statusDoDia.findMany({
      where: { dia: { gte: diaUtc(inicio) } },
    });

    const porChave = new Map(registros.map((r) => [`${r.peca}|${r.dia}`, r]));
    const saida = {} as Record<Peca, { dia: string; uptime: number | null }[]>;

    for (const peca of PECAS) {
      saida[peca] = Array.from({ length: DIAS_GUARDADOS }, (_, i) => {
        const dia = diaUtc(new Date(inicio.getTime() + i * 24 * 60 * 60 * 1000));
        const registro = porChave.get(`${peca}|${dia}`);

        if (!registro?.medidas) return { dia, uptime: null };

        const bons = registro.medidas - registro.falhas;
        return { dia, uptime: Math.round((bons / registro.medidas) * 10000) / 100 };
      });
    }

    return saida;
  },

  /// Liga o relógio. Devolve como desligar, pro encerramento limpo — o mesmo
  /// contrato do `exclusao-service`.
  vigiar(log?: FastifyBaseLogger) {
    const rodada = () => {
      void estadoAgora()
        .then(async (medidas) => {
          await gravar(medidas);

          const caidas = medidas.filter((m) => m.estado === "down").map((m) => m.peca);
          if (caidas.length) log?.warn({ caidas }, "peças fora do ar");
        })
        .catch((err) => log?.error({ err }, "rodada de status falhou"));
    };

    /// A poda é barata e rara; uma vez por hora basta e não pesa.
    const limpeza = () => {
      void podar()
        .then((apagados) => apagados && log?.info({ apagados }, "dias de status podados"))
        .catch((err) => log?.error({ err }, "poda de status falhou"));
    };

    const primeira = setTimeout(rodada, ATRASO_INICIAL_MS);
    const relogio = setInterval(rodada, INTERVALO_MS);
    const faxina = setInterval(limpeza, 60 * 60 * 1000);

    primeira.unref();
    relogio.unref();
    faxina.unref();

    return () => {
      clearTimeout(primeira);
      clearInterval(relogio);
      clearInterval(faxina);
    };
  },
};
