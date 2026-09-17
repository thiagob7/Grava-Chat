import { isMain, startBot } from "./bot-kit.mjs";

export const CATEGORIES = [
  { value: "questions", label: "Dúvidas", emoji: "💬", description: "Dúvidas em geral" },
  { value: "order", label: "Orçamento", emoji: "🛠️", description: "Pedir um orçamento" },
  { value: "other", label: "Outros", emoji: "📁", description: "Casos não citados acima" },
];

const ACCESS = ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY"];

export const panelMessage = () => ({
  content: "",
  embeds: [
    {
      title: "📮 Central de atendimento",
      description: "Precisa de ajuda? Escolha a categoria e a equipe fala com você num canal privado.",
      color: 0xed4245,
    },
  ],
  components: [
    {
      components: [
        {
          type: "select",
          customId: "ticket:category",
          placeholder: "Selecione a categoria do seu atendimento",
          options: CATEGORIES,
        },
      ],
    },
  ],
});

export const ticketMessage = ({ clientId, category, status, staffId, closed }) => ({
  content: staffId && !closed ? `👋 <@${clientId}>, seu atendimento foi aceito por <@${staffId}>!` : `<@${clientId}>`,
  embeds: [
    {
      title: `${category.emoji} Atendimento: ${category.label}`,
      color: closed ? 0x80848e : staffId ? 0x57f287 : 0xfee75c,
      fields: [
        { name: "Cliente", value: `<@${clientId}>`, inline: true },
        { name: "Status", value: status, inline: true },
        ...(staffId ? [{ name: "Atendente", value: `<@${staffId}>`, inline: true }] : []),
      ],
      timestamp: new Date().toISOString(),
    },
  ],
  components: [
    {
      components: [
        {
          type: "button",
          style: "success",
          label: "Aceitar",
          emoji: "✅",
          customId: `ticket:accept:${clientId}:${category.value}`,
          disabled: Boolean(staffId) || closed,
        },
        {
          type: "button",
          style: "danger",
          label: "Concluir",
          emoji: "🏁",
          customId: `ticket:close:${clientId}:${category.value}:${staffId ?? ""}`,
          disabled: closed,
        },
      ],
    },
  ],
});

const channelName = (user) =>
  `ticket-${user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 40);

if (isMain(import.meta.url)) {
  const staffRoleId = process.env.TICKETS_STAFF_ROLE_ID;
  const categoryId = process.env.TICKETS_CATEGORY_ID || null;

  if (!staffRoleId) {
    console.error("Missing TICKETS_STAFF_ROLE_ID: the id of the role that answers tickets.");
    process.exit(1);
  }

  const bot = startBot("tickets-bot");

  bot.onReady(() =>
    bot.setCommands([{ name: "ticket-panel", description: "Posta o painel de atendimento neste canal", options: [] }]),
  );

  bot.onCommand(async (command) => {
    if (command.command !== "ticket-panel") return;
    await bot.reply(command, panelMessage());
  });

  bot.onInteraction(async (interaction) => {
    if (!interaction.guildId || interaction.type !== "component") return;

    const [scope, action, clientId, categoryValue, staffId] = interaction.customId.split(":");
    if (scope !== "ticket") return;

    const isStaff = interaction.member?.roleIds.includes(staffRoleId) ?? false;

    if (action === "category") {
      const category = CATEGORIES.find((c) => c.value === interaction.values[0]);
      if (!category) return;

      const guild = interaction.guildId;
      const channel = await bot.api("POST", `/bot/servidores/${guild}/canais`, {
        name: channelName(interaction.user),
        type: "TEXT",
        isPrivate: true,
        categoryId,
      });

      await Promise.all([
        bot.api("PUT", `/bot/guilds/${guild}/channels/${channel.id}/permissions/${interaction.user.id}`, {
          type: "MEMBER",
          allow: ACCESS,
          deny: [],
        }),
        bot.api("PUT", `/bot/guilds/${guild}/channels/${channel.id}/permissions/${staffRoleId}`, {
          type: "ROLE",
          allow: ACCESS,
          deny: [],
        }),
      ]);

      await bot.replyPrivately(interaction, `Seu atendimento foi aberto em <#${channel.id}>.`);
      await bot.api(
        "POST",
        `/bot/canais/${channel.id}/mensagens`,
        ticketMessage({ clientId: interaction.user.id, category, status: "Aguardando a equipe" }),
      );
      return;
    }

    const category = CATEGORIES.find((c) => c.value === categoryValue);
    if (!category) return;

    if (action === "accept") {
      if (!isStaff) return bot.replyPrivately(interaction, "Só a equipe pode aceitar um atendimento.");

      return bot.update(interaction, ticketMessage({ clientId, category, status: "Em andamento", staffId: interaction.user.id }));
    }

    if (action === "close") {
      if (!isStaff && interaction.user.id !== clientId) {
        return bot.replyPrivately(interaction, "Só a equipe ou quem abriu pode concluir.");
      }

      await bot.update(interaction, ticketMessage({ clientId, category, status: "Concluído", staffId: staffId || null, closed: true }));
      await bot.api("PUT", `/bot/guilds/${interaction.guildId}/channels/${interaction.channelId}/permissions/${clientId}`, {
        type: "MEMBER",
        allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"],
        deny: ["SEND_MESSAGES"],
      });
    }
  });
}
