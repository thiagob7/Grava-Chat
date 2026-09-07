import type { FastifyBaseLogger } from "fastify";

import { ADMINS } from "~/lib/serialize.js";
import { prisma } from "~/lib/prisma.js";
import { enviarMensagem } from "~/realtime/difusao.js";
import { dmRepository } from "~/repositories/friendship-repository.js";
import { guildRepository } from "~/repositories/guild-repository.js";
import { userRepository } from "~/repositories/user-repository.js";
import { accessService } from "~/services/access-service.js";
import { sistemaService } from "~/services/sistema-service.js";

export const MOTIVOS_DE_DENUNCIA = ["spam", "assedio", "conteudo", "golpe", "outro"] as const;
export type MotivoDeDenuncia = (typeof MOTIVOS_DE_DENUNCIA)[number];

const NOME_DO_MOTIVO: Record<MotivoDeDenuncia, string> = {
  spam: "Spam ou propaganda",
  assedio: "Assédio ou ódio",
  conteudo: "Conteúdo impróprio",
  golpe: "Golpe ou fraude",
  outro: "Outro",
};

/*
  Denunciar uma comunidade.

  Fica registrado e vai, na hora, para a conversa que cada administrador do
  app tem com a conta da casa — o mesmo canal dos outros avisos. Quem
  denuncia precisa estar na comunidade: não se denuncia o que não se viu.
*/
export const denunciaService = {
  async denunciarServidor(
    userId: string,
    guildId: string,
    dados: { motivo: MotivoDeDenuncia; detalhes?: string },
    log?: FastifyBaseLogger,
  ) {
    await accessService.requireMember(userId, guildId);
    const guild = await guildRepository.findByIdOrThrow(guildId);
    const autor = await userRepository.findByIdOrThrow(userId);

    const denuncia = await prisma.denuncia.create({
      data: { guildId, autorId: userId, motivo: dados.motivo, detalhes: dados.detalhes ?? null },
    });

    const casa = await sistemaService.usuario();
    const texto = [
      `Denúncia de comunidade: ${guild.name} (${guild.id})`,
      `Motivo: ${NOME_DO_MOTIVO[dados.motivo]}`,
      dados.detalhes ? `Detalhes: ${dados.detalhes}` : null,
      `Por @${autor.username} (${autor.id})`,
    ]
      .filter(Boolean)
      .join("\n");

    for (const email of ADMINS) {
      try {
        const admin = await userRepository.findByEmail(email);
        if (!admin || admin.id === casa.id) continue;

        const canal =
          (await dmRepository.findBetween(casa.id, admin.id)) ?? (await dmRepository.create([casa.id, admin.id]));

        await enviarMensagem(casa.id, { channelId: canal.id, content: texto });
      } catch (err) {
        log?.error({ err }, `denúncia: não deu para avisar ${email}`);
      }
    }

    return { id: denuncia.id };
  },
};
