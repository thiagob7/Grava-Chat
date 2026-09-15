import { isMain, startBot } from "./bot-kit.mjs";

export const reportForm = (suspectId) => ({
  customId: "report:form",
  title: "Denunciar",
  fields: [
    {
      customId: "who",
      label: "Quem",
      style: "short",
      placeholder: "Nome ou @ da pessoa",
      maxLength: 100,
      ...(suspectId ? { value: `<@${suspectId}>` } : {}),
    },
    { customId: "what", label: "O que aconteceu", style: "paragraph", minLength: 10, maxLength: 1000 },
    { customId: "proof", label: "Link de prova", style: "short", required: false, placeholder: "https://…" },
  ],
});

export const reportMessage = ({ reporterId, fields, handledBy, outcome }) => ({
  content: "",
  embeds: [
    {
      title: "🚨 Nova denúncia",
      color: handledBy ? 0x80848e : 0xed4245,
      fields: [
        { name: "Quem", value: fields.who, inline: true },
        { name: "Enviada por", value: `<@${reporterId}>`, inline: true },
        { name: "O que aconteceu", value: fields.what },
        ...(fields.proof ? [{ name: "Prova", value: fields.proof }] : []),
      ],
      ...(handledBy ? { footer: { text: `${outcome} por ${handledBy}` } } : {}),
      timestamp: new Date().toISOString(),
    },
  ],
  components: [
    {
      components: [
        { type: "button", style: "success", label: "Resolvida", customId: "report:resolved", disabled: Boolean(handledBy) },
        { type: "button", style: "secondary", label: "Arquivar", customId: "report:archived", disabled: Boolean(handledBy) },
      ],
    },
  ],
});

const stored = new Map();

if (isMain(import.meta.url)) {
  const reportsChannelId = process.env.REPORTS_CHANNEL_ID;
  const moderatorRoleId = process.env.REPORTS_MOD_ROLE_ID;

  if (!reportsChannelId || !moderatorRoleId) {
    console.error("Missing REPORTS_CHANNEL_ID (moderation channel) or REPORTS_MOD_ROLE_ID (moderator role).");
    process.exit(1);
  }

  const bot = startBot("reports-bot");

  bot.onReady(() =>
    bot.setCommands([
      {
        name: "report",
        description: "Denuncia alguém pra moderação, em particular",
        options: [{ name: "who", description: "Quem você quer denunciar", kind: "usuario" }],
      },
    ]),
  );

  bot.onCommand(async (command) => {
    if (command.command !== "report") return;
    await bot.openModal(command, reportForm(command.options.who));
  });

  bot.onInteraction(async (interaction) => {
    if (interaction.type === "modal" && interaction.customId === "report:form") {
      const message = await bot.api(
        "POST",
        `/bot/canais/${reportsChannelId}/mensagens`,
        reportMessage({ reporterId: interaction.user.id, fields: interaction.fields }),
      );
      stored.set(message.id, { reporterId: interaction.user.id, fields: interaction.fields });

      return bot.replyPrivately(interaction, "Denúncia enviada pra moderação. Obrigado por avisar.");
    }

    if (interaction.type !== "component" || !interaction.customId.startsWith("report:")) return;

    if (!interaction.member?.roleIds.includes(moderatorRoleId)) {
      return bot.replyPrivately(interaction, "Só a moderação decide denúncias.");
    }

    const report = stored.get(interaction.messageId);
    if (!report) return bot.replyPrivately(interaction, "O bot reiniciou e perdeu os detalhes desta denúncia.");

    const outcome = interaction.customId === "report:resolved" ? "Resolvida" : "Arquivada";
    await bot.update(interaction, reportMessage({ ...report, handledBy: interaction.user.displayName, outcome }));
    stored.delete(interaction.messageId);
  });
}
