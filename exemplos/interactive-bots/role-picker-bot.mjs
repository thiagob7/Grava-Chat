import { isMain, startBot } from "./bot-kit.mjs";

export const parseRoles = (text) =>
  (text ?? "")
    .split(",")
    .map((pair) => pair.trim().split(":"))
    .filter(([label, id]) => label && /^[a-f\d]{24}$/i.test(id ?? ""))
    .map(([label, id]) => ({ label: label.trim(), value: id }));

export const pickerMessage = (roles) => ({
  content: "",
  embeds: [{ title: "🎮 Escolha seus cargos", description: "Marque os que combinam com você. Dá pra mudar quando quiser.", color: 0x5865f2 }],
  components: [
    {
      components: [
        { type: "select", customId: "roles:pick", placeholder: "Seus cargos", minValues: 0, maxValues: roles.length, options: roles },
      ],
    },
  ],
});

export const nextRoles = (current, offered, chosen) => {
  const offeredIds = new Set(offered.map((role) => role.value));
  return [...current.filter((id) => !offeredIds.has(id)), ...chosen.filter((id) => offeredIds.has(id))];
};

if (isMain(import.meta.url)) {
  const roles = parseRoles(process.env.ROLE_PICKER_ROLES);

  if (!roles.length) {
    console.error('Missing ROLE_PICKER_ROLES, like "Minecraft:<roleId>,Roblox:<roleId>".');
    process.exit(1);
  }

  const bot = startBot("role-picker-bot");

  bot.onReady(() =>
    bot.setCommands([{ name: "roles-panel", description: "Posta o painel de cargos neste canal", options: [] }]),
  );

  bot.onCommand(async (command) => {
    if (command.command !== "roles-panel") return;
    await bot.reply(command, pickerMessage(roles));
  });

  bot.onInteraction(async (interaction) => {
    if (interaction.type !== "component" || interaction.customId !== "roles:pick" || !interaction.guildId) return;

    const roleIds = nextRoles(interaction.member?.roleIds ?? [], roles, interaction.values);
    await bot.api("PUT", `/bot/servidores/${interaction.guildId}/membros/${interaction.user.id}/cargos`, { roleIds });

    const names = roles.filter((role) => interaction.values.includes(role.value)).map((role) => role.label);
    await bot.replyPrivately(interaction, names.length ? `Pronto! Seus cargos: ${names.join(", ")}.` : "Pronto! Tirei os cargos do painel.");
  });
}
