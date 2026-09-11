import React, { useState } from "react";
import {
  Ban,
  FileClock,
  Hash,
  Shield,
  ShieldAlert,
  Trash2,
  UserMinus,
  Webhook,
} from "lucide-react";
import type { GuildMember } from "@gravae/shared";

import { useFindAuditLog } from "~/@core/application/queries/moderation/use-moderation";
import type { AuditEntryModel } from "~/@core/application/requests/moderation/moderation";
import { Avatar } from "~/features/perfil/components/Avatar";
import { SelectField } from "~/components/ui/select";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

interface AuditLogSectionProps {
  guildId: string;
  members: GuildMember[];
}

const PHRASES: Record<string, (target: string) => string> = {
  "guild.update": () => "fez alterações no servidor",
  "channel.create": (a) => `criou o canal ${a}`,
  "channel.update": (a) => `fez alterações em ${a}`,
  "channel.delete": (a) => `apagou o canal ${a}`,
  "role.create": (a) => `criou o cargo ${a}`,
  "role.update": (a) => `fez alterações no cargo ${a}`,
  "role.delete": (a) => `apagou o cargo ${a}`,
  "member.ban": (a) => `baniu ${a}`,
  "member.unban": (a) => `desbaniu ${a}`,
  "member.timeout": (a) => `deixou ${a} de castigo`,
  "member.timeout_remove": (a) => `tirou ${a} do castigo`,
  "member.nickname": (a) => `mudou o apelido de ${a}`,
  "emoji.create": (a) => `adicionou o emoji ${a}`,
  "emoji.update": (a) => `renomeou um emoji para ${a}`,
  "emoji.delete": (a) => `apagou o emoji ${a}`,
  "sticker.create": (a) => `adicionou a figurinha ${a}`,
  "sticker.delete": (a) => `apagou a figurinha ${a}`,
  "sound.create": (a) => `adicionou o som ${a}`,
  "sound.delete": (a) => `apagou o som ${a}`,
  "automod.create": (a) => `criou a regra de AutoMod ${a}`,
  "automod.update": (a) => `mudou a regra de AutoMod ${a}`,
  "automod.delete": (a) => `apagou a regra de AutoMod ${a}`,
};

const ICONS: Record<string, React.ElementType> = {
  guild: Shield,
  channel: Hash,
  role: Shield,
  member: UserMinus,
  emoji: FileClock,
  sticker: FileClock,
  sound: FileClock,
  automod: ShieldAlert,
  webhook: Webhook,
};

const FILTERS = [
  { value: "", label: "servidor.auditoria.todasAsAcoes" },
  { value: "member", label: "servidor.auditoria.filtroMembros" },
  { value: "role", label: "servidor.cargos.titulo" },
  { value: "channel", label: "servidor.auditoria.filtroCanais" },
  { value: "emoji", label: "servidor.auditoria.filtroEmojis" },
  { value: "automod", label: "servidor.automod.titulo" },
  { value: "guild", label: "servidor.auditoria.filtroServidor" },
];

export const AuditLogSection: React.FC<AuditLogSectionProps> = ({
  guildId,
  members,
}) => {
  const { t } = useTranslation();
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useFindAuditLog(guildId, {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
  });

  return (
    <div data-gc="servidor.server-settings.audit-log-section.div" className="max-w-3xl pb-10">
      <div data-gc="servidor.server-settings.audit-log-section.div--2" className="flex items-end gap-4">
        <h2 data-gc="servidor.server-settings.audit-log-section.h2" className="flex-1 text-xl font-semibold">{t("servidor.auditoria.titulo")}</h2>

        <label data-gc="servidor.server-settings.audit-log-section.label" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("servidor.auditoria.porUsuario")}
          <SelectField data-gc="servidor.server-settings.audit-log-section.select-field.set-actor-id"
            value={actorId}
            onSelect={setActorId}
            className="mt-1 w-44 font-normal normal-case"
            options={[
              { value: "", label: t("servidor.auditoria.todosOsUsuarios") },
              ...members.map((m) => ({
                value: m.user.id,
                label: m.user.displayName,
              })),
            ]}
          />
        </label>

        <label data-gc="servidor.server-settings.audit-log-section.label--2" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("servidor.auditoria.porAcao")}
          <SelectField data-gc="servidor.server-settings.audit-log-section.select-field.set-action"
            value={action}
            onSelect={setAction}
            className="mt-1 w-40 font-normal normal-case"
            options={FILTERS.map((f) => ({ value: f.value, label: t(f.label) }))}
          />
        </label>
      </div>

      <div data-gc="servidor.server-settings.audit-log-section.div--3" className="mt-6 space-y-2">
        {isLoading && <p data-gc="servidor.server-settings.audit-log-section.p" className="text-sm text-ink-faint">{t("comum.carregando")}</p>}

        {!isLoading && !data?.entries.length && (
          <p data-gc="servidor.server-settings.audit-log-section.p--2" className="py-10 text-center text-sm text-ink-faint">
            {t("servidor.auditoria.vazio")}
          </p>
        )}

        {(data?.entries ?? []).map((entry) => (
          <Entry data-gc="servidor.server-settings.audit-log-section.entry" key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
};

const Entry: React.FC<{ entry: AuditEntryModel }> = ({ entry }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const Icon =
    ICONS[entry.targetType] ??
    (entry.action.includes("ban") ? Ban : Trash2);

  const phrase =
    PHRASES[entry.action]?.(entry.targetName ?? "algo") ??
    `${entry.action} ${entry.targetName ?? ""}`;

  const changes = Object.entries(entry.changes ?? {});

  return (
    <article data-gc="servidor.server-settings.audit-log-section.article" className="rounded-lg bg-surface-1">
      <button data-gc="servidor.server-settings.audit-log-section.button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={!changes.length && !entry.reason}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span data-gc="servidor.server-settings.audit-log-section.span" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-0 text-ink-muted">
          <Icon data-gc="servidor.server-settings.audit-log-section.icon" size={16} />
        </span>

        <Avatar data-gc="servidor.server-settings.audit-log-section.avatar"
          id={entry.actor.id}
          name={entry.actor.displayName}
          url={entry.actor.avatarUrl}
          size={24}
        />

        <span data-gc="servidor.server-settings.audit-log-section.span--2" className="min-w-0 flex-1">
          <span data-gc="servidor.server-settings.audit-log-section.span--3" className="block truncate text-sm">
            <strong data-gc="servidor.server-settings.audit-log-section.strong" className="font-medium text-ink">
              {entry.actor.displayName}
            </strong>{" "}
            {phrase}
          </span>
          <span data-gc="servidor.server-settings.audit-log-section.span--4" className="block text-xs text-ink-faint">
            {formatTimestamp(entry.createdAt)}
          </span>
        </span>
      </button>

      {isOpen && (
        <div data-gc="servidor.server-settings.audit-log-section.div--4" className="border-t border-line px-3 py-2 text-xs text-ink-muted">
          {entry.reason && (
            <p data-gc="servidor.server-settings.audit-log-section.p--3" className="mb-1">
              <span data-gc="servidor.server-settings.audit-log-section.span--5" className="text-ink-faint">{t("servidor.auditoria.motivo")}</span> {entry.reason}
            </p>
          )}

          {changes.map(([field, value]) => (
            <p data-gc="servidor.server-settings.audit-log-section.p--4" key={field}>
              <span data-gc="servidor.server-settings.audit-log-section.span--6" className="text-ink-faint">{field}:</span>{" "}
              {format(value.de)} → {format(value.toward)}
            </p>
          ))}
        </div>
      )}
    </article>
  );
};

const format = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "vazio";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "vazio";
  if (typeof value === "boolean") return value ? "sim" : "não";

  return String(value);
};
