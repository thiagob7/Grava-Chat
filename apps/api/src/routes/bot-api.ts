import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { definirComandosInput, editMessageInput, sendMessageInput, rooms } from "@gravae/shared";

import { ForbiddenError, UnauthorizedError } from "~/lib/http.js";
import {
  apagarMensagem,
  editarMensagem,
  enviarMensagem,
  reagir,
} from "~/realtime/difusao.js";
import { io } from "~/realtime/io.js";
import { channelRepository, memberRepository } from "~/repositories/guild-repository.js";
import { botService } from "~/services/bot-service.js";
import { objectId } from "~/validations/common.js";

const guildParams = z.object({ guildId: objectId });
const canalParams = z.object({ channelId: objectId });
const mensagemParams = z.object({ messageId: objectId });

/// O canal vem do caminho, então tirá-lo do corpo evita a pergunta boba de
/// qual vale quando os dois vêm e discordam.
const enviarBody = sendMessageInput.omit({ channelId: true, nonce: true });

/// Do schema compartilhado, para o limite de tamanho não virar dois números
/// que um dia discordam.
const editarBody = editMessageInput.omit({ messageId: true });

/*
  O emoji vai no caminho, percent-encoded — `🔥` ou `%3Afogo%3A` para o custom
  `:fogo:`. É a forma que o Discord usa, e evita `DELETE` com corpo, que boa
  parte dos clientes e proxies trata mal.
*/
const reacaoParams = mensagemParams.extend({ emoji: z.string().min(1).max(80) });
const reacaoBody = z.object({ burst: z.boolean().optional() });

/**
 * A API que um bot usa por HTTP, com o próprio token.
 *
 * O WebSocket serve para reagir ao que acontece; isto serve para PERGUNTAR —
 * quais são os canais, quem está no servidor. Um painel de configuração
 * precisa disso antes de qualquer evento acontecer, e não teria como abrir um
 * socket só para desenhar um `<select>` de canais.
 */
async function botDoToken(req: FastifyRequest) {
  const cabecalho = req.headers.authorization;
  if (!cabecalho?.startsWith("Bot ")) throw new UnauthorizedError("Falta o token do bot");

  const dono = await botService.resolverToken(cabecalho.slice(4).trim());
  if (!dono) throw new UnauthorizedError("Token de bot inválido");

  return dono;
}

/// O bot só enxerga servidor onde ele foi adicionado. Sem isto, qualquer token
/// leria a estrutura de qualquer servidor da plataforma.
async function exigirPresenca(botUserId: string, guildId: string) {
  const membro = await memberRepository.find(guildId, botUserId);
  if (!membro) throw new ForbiddenError("Esse bot não está nesse servidor");
}

export async function botApiRoutes(app: FastifyInstance) {
  app.get("/bot/eu", async (req) => {
    const { botId, userId } = await botDoToken(req);
    return { botId, userId };
  });

  app.get("/bot/servidores", async (req) => {
    const { botId } = await botDoToken(req);
    return botService.servidoresDe(botId);
  });

  app.get("/bot/servidores/:guildId/canais", async (req) => {
    const { userId } = await botDoToken(req);
    const { guildId } = guildParams.parse(req.params);

    await exigirPresenca(userId, guildId);

    const canais = await channelRepository.findManyByGuild(guildId);

    return canais.map((c) => ({ id: c.id, name: c.name, type: c.type }));
  });

  /*
    Escrever, pelo mesmo token.

    Nenhuma checagem de permissão nova mora aqui, e é de propósito: o token do
    bot resolve para um `userId`, e o `messageService` já cobra de qualquer um
    a mesma coisa — acesso ao canal, castigo, SEND_MESSAGES, ATTACH_FILES,
    CREATE_POLLS, modo lento. Um bot é um membro; repetir a regra aqui só
    criaria uma segunda versão dela para divergir da primeira.

    O `exigirPresenca` das rotas de leitura também não aparece: ele responde
    "de quais servidores este bot faz parte", e para escrever o que vale é o
    acesso ao canal, que é mais estrito e já é verificado lá dentro.
  */
  /*
    Os comandos de barra que o bot declara.

    A lista inteira de uma vez, substituindo a anterior. Apagar um comando é
    deixar de mandá-lo — o bot não precisa lembrar o que registrou da última
    vez, e um bot que sobe com a lista errada se conserta reiniciando.
  */
  app.put("/bot/comandos", async (req) => {
    const { botId } = await botDoToken(req);
    const { comandos } = definirComandosInput.parse(req.body);

    const salvos = await botService.definirComandos(botId, comandos);

    /*
      Avisar os servidores onde ele está.

      Sem isto, quem estava com o app aberto continuaria com a lista velha até
      recarregar a página — oferecendo um comando que sumiu, ou escondendo um
      que acabou de nascer.
    */
    for (const servidor of await botService.servidoresDe(botId)) {
      io().to(rooms.guild(servidor.id)).emit("commands:changed", { guildId: servidor.id });
    }

    return { comandos: salvos };
  });

  app.post("/bot/canais/:channelId/mensagens", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { channelId } = canalParams.parse(req.params);

    const message = await enviarMensagem(userId, {
      ...enviarBody.parse(req.body),
      channelId,
    });

    return reply.status(201).send(message);
  });

  app.patch("/bot/mensagens/:messageId", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId } = mensagemParams.parse(req.params);
    const { content } = editarBody.parse(req.body);

    return editarMensagem(userId, { messageId, content });
  });

  app.delete("/bot/mensagens/:messageId", async (req, reply) => {
    const { userId } = await botDoToken(req);
    const { messageId } = mensagemParams.parse(req.params);

    await apagarMensagem(userId, messageId);

    return reply.status(204).send();
  });

  app.put("/bot/mensagens/:messageId/reacoes/:emoji", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId, emoji } = reacaoParams.parse(req.params);
    const { burst } = reacaoBody.parse(req.body ?? {});

    const { reactions } = await reagir(userId, messageId, emoji, true, burst ?? false);

    return { reactions };
  });

  app.delete("/bot/mensagens/:messageId/reacoes/:emoji", async (req) => {
    const { userId } = await botDoToken(req);
    const { messageId, emoji } = reacaoParams.parse(req.params);

    const { reactions } = await reagir(userId, messageId, emoji, false);

    return { reactions };
  });
}
