import type { FastifyBaseLogger } from "fastify";

import { prisma } from "~/lib/prisma.js";

/*
  A rotina que apaga de verdade as contas cujo prazo venceu.

  Ela é a única parte irreversível do fluxo de exclusão. Tudo antes dela é
  reversível de propósito: marcar a conta não destrói nada, e é isso que torna
  os quinze dias uma promessa e não um enfeite.

  Roda de hora em hora. Não precisa de precisão — uma conta que morre às 14h em
  vez de às 13h05 cumpriu igualmente o prazo de quinze dias, e um relógio
  frouxo custa muito menos que um agendador de verdade numa VM de 1 GB.
*/
const INTERVALO_MS = 60 * 60 * 1000;

/// Espera antes da primeira passada: a subida do servidor já tem o que fazer,
/// e nada aqui é urgente ao ponto de disputar com o primeiro pedido.
const ATRASO_INICIAL_MS = 60_000;

/*
  Quantas contas por rodada.

  Apagar uma conta encosta em vinte e duas tabelas. Sem teto, um dia com muitas
  vencidas viraria uma rajada de escritas capaz de deixar o resto do app lento —
  e não há pressa: quem sobrar é apagado na hora seguinte.
*/
const POR_RODADA = 20;

export const exclusaoService = {
  /*
    Apaga o que venceu, e devolve o que fez.

    A ordem importa e não é arbitrária. `Guild.owner` e `Webhook.createdBy` são
    as duas únicas relações do usuário SEM `onDelete: Cascade`, então elas
    precisam sair antes — com elas de pé, o `user.delete` seria recusado. As
    outras vinte o Prisma cascateia sozinho.
  */
  async purgarVencidas(log?: FastifyBaseLogger) {
    const vencidas = await prisma.user.findMany({
      where: { excluirEm: { not: null, lte: new Date() } },
      select: { id: true, username: true },
      take: POR_RODADA,
    });

    if (!vencidas.length) return { apagadas: 0, adiadas: 0 };

    let apagadas = 0;
    let adiadas = 0;

    for (const conta of vencidas) {
      /*
        Servidor que GANHOU gente durante o prazo adia a exclusão.

        Na hora do pedido só passa quem é dono de servidores vazios. Mas quinze
        dias é tempo de sobra pra alguém entrar por um convite antigo — e aí
        apagar o servidor junto destruiria dado de terceiros por causa de uma
        decisão que não foi deles.

        Adiar é o certo: a conta continua desativada, que era o que a pessoa
        pediu, e ninguém perde nada. Fica registrado para alguém resolver.
      */
      const donaDe = await prisma.guild.findMany({
        where: { ownerId: conta.id },
        select: { id: true, name: true, _count: { select: { members: true } } },
      });

      const comGente = donaDe.filter((g) => g._count.members > 1);

      if (comGente.length) {
        adiadas++;
        log?.warn(
          { conta: conta.username, servidores: comGente.map((g) => g.name) },
          "exclusão adiada: a pessoa virou dona de servidor com outras pessoas durante o prazo",
        );
        continue;
      }

      try {
        await prisma.$transaction([
          /// Servidores vazios dela. Cascateiam canais, mensagens e o resto.
          prisma.guild.deleteMany({ where: { ownerId: conta.id } }),

          /*
            Webhooks que ela criou em servidores dos OUTROS.

            `createdById` é obrigatório e não cascateia: sem dono o registro não
            pode existir, então some junto. É a única coisa daqui que afeta
            outra pessoa, e não há alternativa no formato atual — webhook órfão
            é um estado que o schema não permite.
          */
          prisma.webhook.deleteMany({ where: { createdById: conta.id } }),

          prisma.user.delete({ where: { id: conta.id } }),
        ]);

        apagadas++;
        log?.info({ conta: conta.username }, "conta apagada — prazo vencido");
      } catch (erro) {
        /*
          Uma conta que falha não pode levar as outras junto. Sem este `catch`,
          um caso estranho — uma relação nova sem cascade, um documento
          inconsistente — travaria a rodada inteira, e a fila só cresceria.
        */
        adiadas++;
        log?.error({ err: erro, conta: conta.username }, "não consegui apagar a conta");
      }
    }

    return { apagadas, adiadas };
  },

  /// Liga o relógio. Devolve como desligar, pro encerramento limpo.
  vigiar(log?: FastifyBaseLogger) {
    const rodada = () => {
      void exclusaoService
        .purgarVencidas(log)
        .then(({ apagadas, adiadas }) => {
          if (apagadas || adiadas) log?.info({ apagadas, adiadas }, "rodada de exclusão");
        })
        .catch((err) => log?.error({ err }, "rodada de exclusão falhou"));
    };

    const primeira = setTimeout(rodada, ATRASO_INICIAL_MS);
    const relogio = setInterval(rodada, INTERVALO_MS);

    primeira.unref();
    relogio.unref();

    return () => {
      clearTimeout(primeira);
      clearInterval(relogio);
    };
  },
};
