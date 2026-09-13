import React, { useState } from "react";
import {
  AudioLines,
  Award,
  ChevronDown,
  Gavel,
  Hash,
  Link,
  ListFilter,
  Minus,
  Pencil,
  Plus,
  ScrollText,
  Settings,
  ShieldAlert,
  Smile,
  Sticker,
  Tag,
  User,
  Webhook,
} from "lucide-react";
import type { GuildMember } from "@gravae/shared";

import { useFindAuditLog } from "~/@core/application/queries/moderation/use-moderation";
import type { AuditEntryModel } from "~/@core/application/requests/moderation/moderation";
import { EmptyState } from "~/components/ui/empty-state";
import { Label } from "~/components/ui/input";
import { SelectField } from "~/components/ui/select";
import { Avatar } from "~/features/perfil/components/Avatar";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface AuditLogSectionProps {
  guildId: string;
  members: GuildMember[];
}

type Tone = "create" | "update" | "delete";

const ACTIONS: Record<string, { label: string; tone: Tone; phrase: (target: string) => string }> = {
  "guild.update": { label: "Atualizar servidor", tone: "update", phrase: () => "atualizou as configurações do servidor" },
  "guild.comunidade": { label: "Ativar comunidade", tone: "create", phrase: () => "ativou os recursos de comunidade" },
  "channel.create": { label: "Criar canal", tone: "create", phrase: (a) => `criou o canal ${a}` },
  "channel.update": { label: "Atualizar canal", tone: "update", phrase: (a) => `atualizou o canal ${a}` },
  "channel.delete": { label: "Apagar canal", tone: "delete", phrase: (a) => `apagou o canal ${a}` },
  "role.create": { label: "Criar cargo", tone: "create", phrase: (a) => `criou o cargo ${a}` },
  "role.update": { label: "Atualizar cargo", tone: "update", phrase: (a) => `atualizou o cargo ${a}` },
  "role.delete": { label: "Apagar cargo", tone: "delete", phrase: (a) => `apagou o cargo ${a}` },
  "member.roles": { label: "Cargos de membro", tone: "update", phrase: (a) => `mudou os cargos de ${a}` },
  "member.nickname": { label: "Apelido de membro", tone: "update", phrase: (a) => `mudou o apelido de ${a}` },
  "member.timeout": { label: "Castigar membro", tone: "delete", phrase: (a) => `deixou ${a} de castigo` },
  "member.timeout_remove": { label: "Tirar castigo", tone: "create", phrase: (a) => `tirou ${a} do castigo` },
  "member.ban": { label: "Banir membro", tone: "delete", phrase: (a) => `baniu ${a}` },
  "member.unban": { label: "Desbanir membro", tone: "create", phrase: (a) => `desbaniu ${a}` },
  "emoji.create": { label: "Adicionar emoji", tone: "create", phrase: (a) => `adicionou o emoji ${a}` },
  "emoji.update": { label: "Renomear emoji", tone: "update", phrase: (a) => `renomeou um emoji para ${a}` },
  "emoji.delete": { label: "Apagar emoji", tone: "delete", phrase: (a) => `apagou o emoji ${a}` },
  "sticker.create": { label: "Adicionar figurinha", tone: "create", phrase: (a) => `adicionou a figurinha ${a}` },
  "sticker.delete": { label: "Apagar figurinha", tone: "delete", phrase: (a) => `apagou a figurinha ${a}` },
  "sound.create": { label: "Adicionar som", tone: "create", phrase: (a) => `adicionou o som ${a}` },
  "sound.delete": { label: "Apagar som", tone: "delete", phrase: (a) => `apagou o som ${a}` },
  "emblema.create": { label: "Criar emblema", tone: "create", phrase: (a) => `criou o emblema ${a}` },
  "emblema.delete": { label: "Apagar emblema", tone: "delete", phrase: (a) => `apagou o emblema ${a}` },
  "invite.create": { label: "Criar convite", tone: "create", phrase: (a) => `criou o convite ${a}` },
  "invite.delete": { label: "Revogar convite", tone: "delete", phrase: (a) => `revogou o convite ${a}` },
  "automod.create": { label: "Criar regra de AutoMod", tone: "create", phrase: (a) => `criou a regra de AutoMod ${a}` },
  "automod.update": { label: "Atualizar regra de AutoMod", tone: "update", phrase: (a) => `mudou a regra de AutoMod ${a}` },
  "automod.delete": { label: "Apagar regra de AutoMod", tone: "delete", phrase: (a) => `apagou a regra de AutoMod ${a}` },
};

const TARGET_ICONS: Record<string, React.ElementType> = {
  guild: Settings,
  channel: Hash,
  role: Tag,
  member: User,
  emoji: Smile,
  sticker: Sticker,
  sound: AudioLines,
  emblema: Award,
  automod: ShieldAlert,
  webhook: Webhook,
  invite: Link,
};

const TONE_CLASS: Record<Tone, string> = {
  create: "bg-online/15 text-online",
  update: "bg-aviso/15 text-aviso",
  delete: "bg-danger/15 text-danger",
};

const FIELDS: Record<string, string> = {
  name: "nome",
  description: "descrição",
  color: "cor",
  colorSecondary: "segunda cor",
  style: "estilo",
  iconUrl: "ícone",
  iconEmoji: "emoji do ícone",
  bannerUrl: "banner",
  permissions: "permissões",
  hoist: "mostrar separado dos outros",
  mentionable: "permitir menção",
  topic: "tópico",
  slowmodeSeconds: "modo lento",
  userLimit: "limite de pessoas",
  bitrate: "taxa de bits",
  position: "posição",
  categoryId: "categoria",
  tag: "etiqueta",
  systemChannelId: "canal do sistema",
  welcomeEnabled: "mensagens de entrada",
  welcomeMessage: "mensagem de boas-vindas",
  discoverable: "aparecer no Explorar",
  category: "categoria",
  tags: "tags",
  languagePrincipal: "idioma principal",
  afkChannelId: "canal de inatividade",
  afkTimeoutSeconds: "tempo de inatividade",
  defaultNotifications: "notificações padrão",
  flexibleChannelNames: "nomes flexíveis",
  hideOwnerCrown: "ocultar coroa do dono",
  maxUses: "limite de usos",
  expiresAt: "expiração",
};

const iconFor = (entry: Pick<AuditEntryModel, "action" | "targetType">) =>
  entry.action.startsWith("member.ban") || entry.action === "member.unban"
    ? Gavel
    : (TARGET_ICONS[entry.targetType] ?? ScrollText);

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

const NeutralIcon: React.FC<{ icon: React.ElementType; size?: "sm" | "md" }> = ({ icon: Icon, size = "md" }) => (
  <span data-gc="servidor.server-settings.audit-log-section.span"
    className={cn(
      "flex shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-muted",
      size === "sm" ? "size-6" : "size-8",
    )}
  >
    <Icon data-gc="servidor.server-settings.audit-log-section.icon" size={size === "sm" ? 13 : 16} />
  </span>
);

export const AuditLogSection: React.FC<AuditLogSectionProps> = ({ guildId, members }) => {
  const { t } = useTranslation();
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useFindAuditLog(guildId, {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
  });

  const entries = data?.entries ?? [];

  return (
    <div data-gc="servidor.server-settings.audit-log-section.div" className="pb-10">
      <p data-gc="servidor.server-settings.audit-log-section.p" className="text-sm text-ink-muted">Acompanhe o que a moderação faz no servidor.</p>

      <div data-gc="servidor.server-settings.audit-log-section.div--2" className="mt-5 grid gap-3 sm:grid-cols-2">
        <div data-gc="servidor.server-settings.audit-log-section.div--3">
          <Label data-gc="servidor.server-settings.audit-log-section.label" htmlFor="auditoria-usuario" className="mb-2 text-sm normal-case text-ink">
            {t("servidor.auditoria.porUsuario")}
          </Label>
          <SelectField data-gc="servidor.server-settings.audit-log-section.select-field.set-actor-id"
            id="auditoria-usuario"
            value={actorId}
            onSelect={setActorId}
            className="h-11"
            options={[
              { value: "", label: t("servidor.auditoria.todosOsUsuarios") },
              ...members.map((m) => ({
                value: m.user.id,
                label: (
                  <span data-gc="servidor.server-settings.audit-log-section.span--2" className="flex min-w-0 items-center gap-2">
                    <Avatar data-gc="servidor.server-settings.audit-log-section.avatar" id={m.user.id} name={m.user.displayName} url={m.user.avatarUrl} size={20} />
                    <span data-gc="servidor.server-settings.audit-log-section.span--3" className="truncate">{m.user.displayName}</span>
                  </span>
                ),
              })),
            ]}
          />
        </div>

        <div data-gc="servidor.server-settings.audit-log-section.div--4">
          <Label data-gc="servidor.server-settings.audit-log-section.label--2" htmlFor="auditoria-acao" className="mb-2 text-sm normal-case text-ink">
            {t("servidor.auditoria.porAcao")}
          </Label>
          <SelectField data-gc="servidor.server-settings.audit-log-section.select-field.set-action"
            id="auditoria-acao"
            value={action}
            onSelect={setAction}
            className="h-11"
            options={[
              {
                value: "",
                label: (
                  <span data-gc="servidor.server-settings.audit-log-section.span--4" className="flex items-center gap-2">
                    <NeutralIcon data-gc="servidor.server-settings.audit-log-section.neutral-icon" icon={ListFilter} size="sm" />
                    {t("servidor.auditoria.todasAsAcoes")}
                  </span>
                ),
              },
              ...Object.entries(ACTIONS).map(([id, item]) => ({
                value: id,
                label: (
                  <span data-gc="servidor.server-settings.audit-log-section.span--5" className="flex items-center gap-2">
                    <NeutralIcon data-gc="servidor.server-settings.audit-log-section.neutral-icon--2" icon={iconFor({ action: id, targetType: id.split(".")[0]! })} size="sm" />
                    {item.label}
                  </span>
                ),
              })),
            ]}
          />
        </div>
      </div>

      <div data-gc="servidor.server-settings.audit-log-section.div--5" className="mt-4 space-y-2">
        {isLoading &&
          Array.from({ length: 4 }, (_, i) => (
            <div data-gc="servidor.server-settings.audit-log-section.div--6" key={i} className="h-[74px] animate-pulse rounded-lg border border-line-sutil bg-surface-2" />
          ))}

        {!isLoading && !entries.length && (
          <EmptyState data-gc="servidor.server-settings.audit-log-section.empty-state"
            icon={<ScrollText data-gc="servidor.server-settings.audit-log-section.scroll-text" />}
            title={actorId || action ? "Nada com esse filtro" : "Nenhum registro ainda"}
            description={t("servidor.auditoria.vazio")}
          />
        )}

        {entries.map((entry) => (
          <Entry data-gc="servidor.server-settings.audit-log-section.entry" key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
};

const Entry: React.FC<{ entry: AuditEntryModel }> = ({ entry }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const known = ACTIONS[entry.action];
  const phrase = known ? known.phrase(entry.targetName ?? "algo") : `${entry.action} ${entry.targetName ?? ""}`;

  const changes = Object.entries(entry.changes ?? {});
  const expandable = changes.length > 0 || Boolean(entry.reason);

  return (
    <article data-gc="servidor.server-settings.audit-log-section.article" className="overflow-hidden rounded-lg border border-line-sutil bg-surface-2">
      <button data-gc="servidor.server-settings.audit-log-section.button"
        type="button"
        onClick={() => expandable && setIsOpen((v) => !v)}
        aria-expanded={expandable ? isOpen : undefined}
        className={cn("flex w-full items-center gap-3 px-3 py-4 text-left", expandable ? "transition hover:bg-surface-3" : "cursor-default")}
      >
        <NeutralIcon data-gc="servidor.server-settings.audit-log-section.neutral-icon--3" icon={iconFor(entry)} />
        <Avatar data-gc="servidor.server-settings.audit-log-section.avatar--2" id={entry.actor.id} name={entry.actor.displayName} url={entry.actor.avatarUrl} size={28} />

        <span data-gc="servidor.server-settings.audit-log-section.span--6" className="min-w-0 flex-1">
          <span data-gc="servidor.server-settings.audit-log-section.span--7" className="block text-sm font-semibold text-ink">
            {entry.actor.displayName} {phrase}.
          </span>
          <span data-gc="servidor.server-settings.audit-log-section.span--8" className="block text-xs text-ink-muted">{dateTime.format(new Date(entry.createdAt))}</span>
        </span>

        <ChevronDown data-gc="servidor.server-settings.audit-log-section.chevron-down"
          size={20}
          className={cn("shrink-0 text-ink-muted transition-transform", isOpen && "rotate-180", !expandable && "opacity-30")}
        />
      </button>

      {isOpen && (
        <ul data-gc="servidor.server-settings.audit-log-section.ul" className="space-y-2.5 border-t border-line-sutil px-4 py-3 text-sm">
          {entry.reason && (
            <li data-gc="servidor.server-settings.audit-log-section.li" className="text-ink-muted">
              <span data-gc="servidor.server-settings.audit-log-section.span--9" className="font-semibold text-ink">{t("servidor.auditoria.motivo")}</span> {entry.reason}
            </li>
          )}

          {changes.map(([field, value]) => (
            <Change data-gc="servidor.server-settings.audit-log-section.change" key={field} field={field} before={value.de} after={value.toward} />
          ))}
        </ul>
      )}
    </article>
  );
};

const Change: React.FC<{ field: string; before: unknown; after: unknown }> = ({ field, before, after }) => {
  const label = FIELDS[field] ?? field;
  const empty = (value: unknown) =>
    value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length);

  const kind: Tone =
    field === "removed" ? "delete" : empty(before) ? "create" : empty(after) ? "delete" : "update";

  if (field === "added" || field === "removed") {
    const Sign = field === "added" ? Plus : Minus;
    return (
      <li data-gc="servidor.server-settings.audit-log-section.li--2" className="flex items-start gap-2.5 text-ink-muted">
        <span data-gc="servidor.server-settings.audit-log-section.span--10" className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", TONE_CLASS[kind])}>
          <Sign data-gc="servidor.server-settings.audit-log-section.sign" size={10} strokeWidth={3} />
        </span>
        <span data-gc="servidor.server-settings.audit-log-section.span--11" className="min-w-0 break-words">
          {field === "added" ? "Adicionou" : "Removeu"} <Value data-gc="servidor.server-settings.audit-log-section.value" value={after} />
        </span>
      </li>
    );
  }
  const Icon = kind === "create" ? Plus : kind === "delete" ? Minus : Pencil;

  return (
    <li data-gc="servidor.server-settings.audit-log-section.li--3" className="flex items-start gap-2.5 text-ink-muted">
      <span data-gc="servidor.server-settings.audit-log-section.span--12" className={cn("mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full", TONE_CLASS[kind])}>
        <Icon data-gc="servidor.server-settings.audit-log-section.icon--2" size={10} strokeWidth={3} />
      </span>
      <span data-gc="servidor.server-settings.audit-log-section.span--13" className="min-w-0 break-words">
        {kind === "create" && (
          <>
            Definiu <strong data-gc="servidor.server-settings.audit-log-section.strong" className="font-semibold text-ink">{label}</strong> como <Value data-gc="servidor.server-settings.audit-log-section.value--2" value={after} />
          </>
        )}
        {kind === "delete" && (
          <>
            Tirou <strong data-gc="servidor.server-settings.audit-log-section.strong--2" className="font-semibold text-ink">{label}</strong> (era <Value data-gc="servidor.server-settings.audit-log-section.value--3" value={before} />)
          </>
        )}
        {kind === "update" && (
          <>
            Mudou <strong data-gc="servidor.server-settings.audit-log-section.strong--3" className="font-semibold text-ink">{label}</strong> de <Value data-gc="servidor.server-settings.audit-log-section.value--4" value={before} /> para{" "}
            <Value data-gc="servidor.server-settings.audit-log-section.value--5" value={after} />
          </>
        )}
      </span>
    </li>
  );
};

const Value: React.FC<{ value: unknown }> = ({ value }) => {
  if (typeof value === "string" && /^https?:\/\//.test(value)) {
    return /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(value) ? (
      <a data-gc="servidor.server-settings.audit-log-section.a" href={value} target="_blank" rel="noreferrer" className="inline-flex align-middle">
        <img data-gc="servidor.server-settings.audit-log-section.img" src={value} alt="" className="size-10 rounded-md border border-line-sutil object-cover" />
      </a>
    ) : (
      <a data-gc="servidor.server-settings.audit-log-section.a--2" href={value} target="_blank" rel="noreferrer" className="font-semibold text-ink underline-offset-2 hover:underline">
        um link
      </a>
    );
  }

  return <strong data-gc="servidor.server-settings.audit-log-section.strong--4" className="font-semibold text-ink">{format(value)}</strong>;
};

const format = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "vazio";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "vazio";
  if (typeof value === "boolean") return value ? "sim" : "não";
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
};
