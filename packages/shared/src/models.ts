import { z } from "zod";
import {
  CHANNEL_TYPES,
  DESIRED_STATUSES,
  SPAM_FILTERS,
  PRESENCE_STATUSES,
  LIMITS,
} from "./constants.js";
import {
  colorHex,
  ROLE_STYLES,
  profileStyleSchema,
  NAME_FONTS,
  statusCustomSchema,
} from "./cosmeticos.js";

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "id invalido");

export const publicUserSchema = z.object({
  id: objectId,
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  status: z.enum(PRESENCE_STATUSES),
  isBot: z.boolean(),
  system: z.boolean().optional(),
  decoration: z.string().optional(),
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const selfUserSchema = publicUserSchema.extend({
  email: z.email(),
  bio: z.string().nullable(),
  pronouns: z.string().nullable(),
  providers: z.array(z.string()),
  createdAt: z.iso.datetime(),
  profile: profileStyleSchema.nullable(),
  customStatus: statusCustomSchema.nullable(),
  desiredStatus: z.enum(DESIRED_STATUSES),
  admin: z.boolean(),

  acceptedRequests: z.boolean(),
  showsActivity: z.boolean(),
  showsServersCommon: z.boolean(),
  showsFriendsCommon: z.boolean(),
  membersAllowDm: z.boolean(),
  spamFilter: z.enum(SPAM_FILTERS),

  deleteAt: z.iso.datetime().nullable(),
  verifiedEmail: z.boolean(),
});
export type SelfUser = z.infer<typeof selfUserSchema>;

export const dmRequestSchema = z.object({
  channelId: objectId,
  de: publicUserSchema,
  spam: z.boolean(),
  serversCommon: z.number().int(),
  createdAt: z.iso.datetime(),
  preview: z.string().nullable(),
});
export type DmRequest = z.infer<typeof dmRequestSchema>;

export const guildSchema = z.object({
  id: objectId,
  name: z.string(),
  iconUrl: z.string().nullable(),
  ownerId: objectId,
  memberCount: z.number().int(),
  verified: z.boolean().optional(),
  detectable: z.boolean().optional(),
});
export type Guild = z.infer<typeof guildSchema>;

export const categorySchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  position: z.number().int(),
});
export type Category = z.infer<typeof categorySchema>;

export const channelSchema = z.object({
  id: objectId,
  guildId: objectId.nullable(),
  categoryId: objectId.nullable(),
  name: z.string(),
  font: z.enum(NAME_FONTS).nullable().optional(),
  type: z.enum(CHANNEL_TYPES),
  url: z.string().nullable().optional(),
  topic: z.string().nullable(),
  position: z.number().int(),
  isPrivate: z.boolean(),
  slowmodeSeconds: z.number().int(),
  contentVisibility: z.enum(["DEFAULT", "SPOILER", "AGE_RESTRICTED"]),
  status: z.string().nullable().optional(),
  bitrate: z.number().int(),
  videoQuality: z.enum(["AUTO", "HD"]),
  userLimit: z.number().int(),
});
export type Channel = z.infer<typeof channelSchema>;

export const attachmentSchema = z.object({
  id: z.string(),
  url: z.string(),
  filename: z.string(),
  contentType: z.string(),
  size: z.number().int(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  spoiler: z.boolean().optional(),
  description: z.string().max(1024).nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  waves: z.string().max(200).nullable().optional(),
});
export type Attachment = z.infer<typeof attachmentSchema>;

export const pollOptionSchema = z.object({
  id: z.string(),
  text: z.string().max(80),
  emoji: z.string().nullable().optional(),
  userIds: z.array(objectId),
});

export const pollSchema = z.object({
  question: z.string().max(200),
  options: z.array(pollOptionSchema).min(2).max(5),
  multiSelect: z.boolean(),
  expiresAt: z.iso.datetime().nullable(),
  closedAt: z.iso.datetime().nullable(),
});
export type Poll = z.infer<typeof pollSchema>;

const embedUrl = z.url({ protocol: /^https?$/ }).max(2048);

export const embedFieldSchema = z.object({
  name: z.string().trim().min(1).max(256),
  value: z.string().trim().min(1).max(1024),
  inline: z.boolean().optional(),
});
export type EmbedField = z.infer<typeof embedFieldSchema>;

export const embedSchema = z.object({
  title: z.string().trim().min(1).max(256).optional(),
  description: z.string().trim().min(1).max(4096).optional(),
  url: embedUrl.optional(),
  color: z.number().int().min(0).max(0xffffff).optional(),
  author: z
    .object({ name: z.string().trim().min(1).max(256), url: embedUrl.optional(), iconUrl: embedUrl.optional() })
    .optional(),
  fields: z.array(embedFieldSchema).max(LIMITS.embedFields).optional(),
  thumbnailUrl: embedUrl.optional(),
  imageUrl: embedUrl.optional(),
  footer: z.object({ text: z.string().trim().min(1).max(2048), iconUrl: embedUrl.optional() }).optional(),
  timestamp: z.iso.datetime({ offset: true }).optional(),
});
export type Embed = z.infer<typeof embedSchema>;

export const embedLength = (embed: Embed) =>
  (embed.title?.length ?? 0) +
  (embed.description?.length ?? 0) +
  (embed.author?.name.length ?? 0) +
  (embed.footer?.text.length ?? 0) +
  (embed.fields ?? []).reduce((total, field) => total + field.name.length + field.value.length, 0);

const hasVisibleContent = (embed: Embed) =>
  Boolean(
    embed.title || embed.description || embed.author || embed.fields?.length || embed.imageUrl || embed.thumbnailUrl || embed.footer,
  );

export const embedsInput = z
  .array(embedSchema)
  .max(LIMITS.embedsPerMessage)
  .superRefine((embeds, ctx) => {
    embeds.forEach((embed, index) => {
      if (!hasVisibleContent(embed)) {
        ctx.addIssue({ code: "custom", path: [index], message: "Embed without anything to show" });
      }
    });

    const total = embeds.reduce((sum, embed) => sum + embedLength(embed), 0);
    if (total > LIMITS.embedTotalLength) {
      ctx.addIssue({ code: "custom", message: `Embeds add up to ${total} characters, the limit is ${LIMITS.embedTotalLength}` });
    }
  });

export const BUTTON_STYLES = ["primary", "secondary", "success", "danger", "link"] as const;
export type ButtonStyle = (typeof BUTTON_STYLES)[number];

const customId = z.string().min(1).max(100);

export const buttonComponentSchema = z.object({
  type: z.literal("button"),
  style: z.enum(BUTTON_STYLES),
  label: z.string().trim().min(1).max(80).optional(),
  emoji: z.string().trim().min(1).max(64).optional(),
  customId: customId.optional(),
  url: embedUrl.optional(),
  disabled: z.boolean().optional(),
});
export type ButtonComponent = z.infer<typeof buttonComponentSchema>;

export const selectOptionSchema = z.object({
  label: z.string().trim().min(1).max(100),
  value: z.string().min(1).max(100),
  description: z.string().trim().min(1).max(100).optional(),
  emoji: z.string().trim().min(1).max(64).optional(),
});
export type SelectOption = z.infer<typeof selectOptionSchema>;

export const selectComponentSchema = z.object({
  type: z.literal("select"),
  customId,
  placeholder: z.string().trim().min(1).max(150).optional(),
  minValues: z.number().int().min(0).max(LIMITS.selectOptions).optional(),
  maxValues: z.number().int().min(1).max(LIMITS.selectOptions).optional(),
  options: z.array(selectOptionSchema).min(1).max(LIMITS.selectOptions),
  disabled: z.boolean().optional(),
});
export type SelectComponent = z.infer<typeof selectComponentSchema>;

export const messageComponentSchema = z.discriminatedUnion("type", [buttonComponentSchema, selectComponentSchema]);
export type MessageComponent = z.infer<typeof messageComponentSchema>;

export const componentRowSchema = z.object({
  components: z.array(messageComponentSchema).min(1).max(LIMITS.componentsPerRow),
});
export type ComponentRow = z.infer<typeof componentRowSchema>;

export const selectLimits = (select: SelectComponent) => {
  const max = Math.min(select.maxValues ?? 1, select.options.length);
  return { min: Math.min(select.minValues ?? 1, max), max };
};

export const componentsInput = z
  .array(componentRowSchema)
  .max(LIMITS.componentRows)
  .superRefine((rows, ctx) => {
    const seen = new Set<string>();

    rows.forEach((row, rowIndex) => {
      const hasSelect = row.components.some((component) => component.type === "select");
      if (hasSelect && row.components.length > 1) {
        ctx.addIssue({ code: "custom", path: [rowIndex], message: "A row with a select cannot hold anything else" });
      }

      row.components.forEach((component, index) => {
        const path = [rowIndex, "components", index];

        if (component.customId) {
          if (seen.has(component.customId)) {
            ctx.addIssue({ code: "custom", path, message: `customId "${component.customId}" is repeated` });
          }
          seen.add(component.customId);
        }

        if (component.type === "button") {
          if (!component.label && !component.emoji) {
            ctx.addIssue({ code: "custom", path, message: "A button needs a label or an emoji" });
          }
          if (component.style === "link" && (!component.url || component.customId)) {
            ctx.addIssue({ code: "custom", path, message: "A link button needs url and no customId" });
          }
          if (component.style !== "link" && (!component.customId || component.url)) {
            ctx.addIssue({ code: "custom", path, message: "A button needs customId and no url, unless its style is link" });
          }
          return;
        }

        const values = component.options.map((option) => option.value);
        if (new Set(values).size !== values.length) {
          ctx.addIssue({ code: "custom", path, message: "Select option values must be unique" });
        }
        if ((component.minValues ?? 1) > (component.maxValues ?? 1)) {
          ctx.addIssue({ code: "custom", path, message: "minValues cannot be greater than maxValues" });
        }
        if ((component.minValues ?? 1) > component.options.length) {
          ctx.addIssue({ code: "custom", path, message: "minValues cannot be greater than the number of options" });
        }
      });
    });
  });

export const stickerSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  description: z.string().nullable(),
  relatedEmoji: z.string(),
  url: z.string(),
});
export type Sticker = z.infer<typeof stickerSchema>;

export const guildEmojiSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  url: z.string(),
  animated: z.boolean(),
});
export type GuildEmoji = z.infer<typeof guildEmojiSchema>;

export const guildSoundSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  emoji: z.string().nullable(),
  url: z.string(),
  volume: z.number(),
});
export type GuildSound = z.infer<typeof guildSoundSchema>;

export const reactionSummarySchema = z.object({
  emoji: z.string(),
  count: z.number().int(),
  me: z.boolean(),
  burst: z.boolean(),
});
export type ReactionSummary = z.infer<typeof reactionSummarySchema>;

export const reactionPeopleSchema = z.object({
  emoji: z.string(),
  count: z.number().int(),
  users: z.array(publicUserSchema),
});
export type ReactionPeople = z.infer<typeof reactionPeopleSchema>;

export const reactionStateSchema = z.object({
  emoji: z.string(),
  userIds: z.array(objectId),
  burst: z.boolean(),
});
export type ReactionState = z.infer<typeof reactionStateSchema>;

export const messageSchema = z.object({
  id: objectId,
  channelId: objectId,
  author: publicUserSchema,
  content: z.string(),
  font: z.enum(NAME_FONTS).nullable().optional(),
  kind: z.enum(["USER", "JOIN", "COMANDO"]),
  attachments: z.array(attachmentSchema),
  poll: pollSchema.nullable(),
  embeds: z.array(embedSchema).optional(),
  components: z.array(componentRowSchema).optional(),
  sticker: stickerSchema.nullable(),
  reactions: z.array(reactionSummarySchema),
  mentions: z.array(objectId),
  mentionRoleIds: z.array(objectId),
  mentionEveryone: z.boolean(),
  replyToId: objectId.nullable(),
  forwarded: z
    .object({ channelId: objectId, messageId: objectId })
    .nullable(),
  postId: objectId.nullable(),
  pinnedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  editedAt: z.iso.datetime().nullable(),
});
export type Message = z.infer<typeof messageSchema>;

export const guildMemberSchema = z.object({
  id: objectId,
  guildId: objectId,
  user: publicUserSchema,
  roleIds: z.array(objectId),
  nickname: z.string().nullable(),
  timeoutUntil: z.iso.datetime().nullable(),
  joinedAt: z.iso.datetime(),
});

export const roleSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  color: z.string().nullable(),
  colorSecondary: z.string().nullable(),
  iconUrl: z.string().nullable(),
  iconEmoji: z.string().nullable(),
  style: z.enum(ROLE_STYLES),
  position: z.number().int(),
  permissions: z.array(z.string()),
  hoist: z.boolean(),
  mentionable: z.boolean(),
  isEveryone: z.boolean(),
});
export type Role = z.infer<typeof roleSchema>;

export const badgeSchema = z.object({
  id: objectId,
  guildId: objectId,
  name: z.string(),
  emoji: z.string().nullable(),
  iconUrl: z.string().nullable(),
});
export type Badge = z.infer<typeof badgeSchema>;

export const overwriteSchema = z.object({
  channelId: objectId,
  targetId: objectId,
  type: z.enum(["ROLE", "MEMBER"]),
  allow: z.array(z.string()),
  deny: z.array(z.string()),
});
export type Overwrite = z.infer<typeof overwriteSchema>;
export type GuildMember = z.infer<typeof guildMemberSchema>;

export const VOICE_DEVICES = ["desktop", "web", "mobile"] as const;
export type VoiceDevice = (typeof VOICE_DEVICES)[number];

export const voiceStateSchema = z.object({
  userId: objectId,
  channelId: objectId,
  guildId: objectId.nullable(),
  socketId: z.string(),
  clientId: z.string().nullable(),
  orphanedAt: z.number().nullable(),
  joinedAt: z.number(),
  selfMute: z.boolean(),
  selfDeaf: z.boolean(),
  serverMute: z.boolean(),
  serverDeaf: z.boolean(),
  camera: z.boolean(),
  screenShare: z.boolean(),
  device: z.enum(VOICE_DEVICES).nullable(),
});
export type VoiceState = z.infer<typeof voiceStateSchema>;

export const voiceServerSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  broadcasting: z.boolean(),
  people: z.array(
    z.object({
      userId: z.string(),
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
    }),
  ),
});
export type VoiceServer = z.infer<typeof voiceServerSchema>;

export const createGuildInput = z.object({
  name: z.string().min(2).max(LIMITS.guildName),
});

export const createChannelInput = z.object({
  name: z.string().min(1).max(LIMITS.channelName),
  font: z.enum(NAME_FONTS).optional(),
  type: z.enum(CHANNEL_TYPES),
  url: z.url({ protocol: /^https?$/ }).max(512).nullable().optional(),
  categoryId: objectId.nullable().optional(),
  topic: z.string().max(512).nullable().optional(),
  isPrivate: z.boolean().optional(),
});

export const createPollInput = z.object({
  question: z.string().min(1).max(200),
  options: z.array(z.object({ text: z.string().min(1).max(80), emoji: z.string().nullable().optional() })).min(2).max(5),
  multiSelect: z.boolean().optional(),
  durationHours: z.number().int().positive().max(720).nullable().optional(),
});

export type CreatePollInput = z.infer<typeof createPollInput>;

export const sendMessageInput = z.object({
  channelId: objectId,
  content: z.string().max(LIMITS.messageLength),
  font: z.enum(NAME_FONTS).optional(),
  attachments: z.array(attachmentSchema).max(LIMITS.attachmentsPerMessage).optional(),
  poll: createPollInput.optional(),
  stickerId: objectId.optional(),
  postId: objectId.nullable().optional(),
  replyToId: objectId.nullable().optional(),
  forwarded: z
    .object({ channelId: objectId, messageId: objectId })
    .nullable()
    .optional(),
  mentionAuthor: z.boolean().optional(),
  nonce: z.string().max(64).optional(),
  retry: z.boolean().optional(),
});

export const editMessageInput = z.object({
  messageId: objectId,
  content: z.string().min(1).max(LIMITS.messageLength),
});

export const botSendMessageInput = sendMessageInput
  .omit({ channelId: true, nonce: true, retry: true })
  .extend({ embeds: embedsInput.optional(), components: componentsInput.optional() });
export type BotSendMessageInput = z.infer<typeof botSendMessageInput>;

export const botEditMessageInput = z
  .object({
    content: z.string().max(LIMITS.messageLength).optional(),
    embeds: embedsInput.optional(),
    components: componentsInput.optional(),
  })
  .refine((input) => input.content !== undefined || input.embeds !== undefined || input.components !== undefined, {
    message: "Send content, embeds, components or a mix",
  });
export type BotEditMessageInput = z.infer<typeof botEditMessageInput>;

export const INTERACTION_RESPONSE_MS = 3000;

export const interactInput = z.object({
  messageId: objectId,
  customId,
  values: z.array(z.string().min(1).max(100)).max(LIMITS.selectOptions).optional(),
});
export type InteractInput = z.infer<typeof interactInput>;

export const interactionCallbackInput = z.discriminatedUnion("type", [
  z.object({ type: z.literal("reply"), data: botSendMessageInput }),
  z.object({ type: z.literal("update"), data: botEditMessageInput }),
  z.object({ type: z.literal("defer") }),
]);
export type InteractionCallbackInput = z.infer<typeof interactionCallbackInput>;

const commandName = z
  .string()
  .regex(/^[a-z0-9_-]{1,32}$/, "Só minúsculas, números, hífen e sublinhado");

export const OPTION_KINDS = ["texto", "numero", "usuario", "canal"] as const;
export type OptionKind = (typeof OPTION_KINDS)[number];

export const commandOptionSchema = z.object({
  name: commandName,
  description: z.string().min(1).max(100),
  kind: z.enum(OPTION_KINDS),
  required: z.boolean().optional(),
});
export type CommandOption = z.infer<typeof commandOptionSchema>;

export const botCommandSchema = z.object({
  name: commandName,
  description: z.string().min(1).max(100),
  options: z.array(commandOptionSchema).max(10).default([]),
});
export type BotCommand = z.infer<typeof botCommandSchema>;

export const setCommandsInput = z.object({
  commands: z.array(botCommandSchema).max(25),
});

export const commandAvailableSchema = botCommandSchema.extend({
  botId: objectId,
  bot: publicUserSchema,
});
export type AvailableCommand = z.infer<typeof commandAvailableSchema>;

export const invokeCommandInput = z.object({
  channelId: objectId,
  botId: objectId,
  command: commandName,
  options: z.record(z.string(), z.string().max(2000)).default({}),
});
