import type { Embed } from "@gravae/shared";

export const embedText = (embed: Embed) =>
  [
    embed.title,
    embed.description,
    embed.author?.name,
    embed.footer?.text,
    ...(embed.fields ?? []).flatMap((field) => [field.name, field.value]),
  ]
    .filter(Boolean)
    .join("\n");

export const toStoredEmbed = (embed: Embed) => ({
  title: embed.title ?? null,
  description: embed.description ?? null,
  url: embed.url ?? null,
  color: embed.color ?? null,
  author: embed.author
    ? { name: embed.author.name, url: embed.author.url ?? null, iconUrl: embed.author.iconUrl ?? null }
    : null,
  fields: (embed.fields ?? []).map((field) => ({ name: field.name, value: field.value, inline: field.inline ?? false })),
  thumbnailUrl: embed.thumbnailUrl ?? null,
  imageUrl: embed.imageUrl ?? null,
  footer: embed.footer ? { text: embed.footer.text, iconUrl: embed.footer.iconUrl ?? null } : null,
  timestamp: embed.timestamp ? new Date(embed.timestamp) : null,
});
