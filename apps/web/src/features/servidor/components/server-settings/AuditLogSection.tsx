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
import { CampoSelect } from "~/components/ui/select";
import { formatTimestamp } from "~/lib/format";
import { useTranslation } from "~/traducao";

interface AuditLogSectionProps {
  guildId: string;
  members: GuildMember[];
}

const FRASES: Record<string, (alvo: string) => string> = {
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

const ICONES: Record<string, React.ElementType> = {
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

const FILTROS = [
  { valor: "", label: "servidor.auditoria.todasAsAcoes" },
  { valor: "member", label: "servidor.auditoria.filtroMembros" },
  { valor: "role", label: "servidor.cargos.titulo" },
  { valor: "channel", label: "servidor.auditoria.filtroCanais" },
  { valor: "emoji", label: "servidor.auditoria.filtroEmojis" },
  { valor: "automod", label: "servidor.automod.titulo" },
  { valor: "guild", label: "servidor.auditoria.filtroServidor" },
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
          <CampoSelect data-gc="servidor.server-settings.audit-log-section.campo-select.set-actor-id"
            valor={actorId}
            onEscolher={setActorId}
            className="mt-1 w-44 font-normal normal-case"
            opcoes={[
              { valor: "", rotulo: t("servidor.auditoria.todosOsUsuarios") },
              ...members.map((m) => ({
                valor: m.user.id,
                rotulo: m.user.displayName,
              })),
            ]}
          />
        </label>

        <label data-gc="servidor.server-settings.audit-log-section.label--2" className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          {t("servidor.auditoria.porAcao")}
          <CampoSelect data-gc="servidor.server-settings.audit-log-section.campo-select.set-action"
            valor={action}
            onEscolher={setAction}
            className="mt-1 w-40 font-normal normal-case"
            opcoes={FILTROS.map((f) => ({ valor: f.valor, rotulo: t(f.label) }))}
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

        {(data?.entries ?? []).map((entrada) => (
          <Entrada data-gc="servidor.server-settings.audit-log-section.entrada" key={entrada.id} entrada={entrada} />
        ))}
      </div>
    </div>
  );
};

const Entrada: React.FC<{ entrada: AuditEntryModel }> = ({ entrada }) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);
  const Icone =
    ICONES[entrada.targetType] ??
    (entrada.action.includes("ban") ? Ban : Trash2);

  const frase =
    FRASES[entrada.action]?.(entrada.targetName ?? "algo") ??
    `${entrada.action} ${entrada.targetName ?? ""}`;

  const mudancas = Object.entries(entrada.changes ?? {});

  return (
    <article data-gc="servidor.server-settings.audit-log-section.article" className="rounded-lg bg-surface-1">
      <button data-gc="servidor.server-settings.audit-log-section.button"
        onClick={() => setAberto((v) => !v)}
        disabled={!mudancas.length && !entrada.reason}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span data-gc="servidor.server-settings.audit-log-section.span" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-0 text-ink-muted">
          <Icone data-gc="servidor.server-settings.audit-log-section.icone" size={16} />
        </span>

        <Avatar data-gc="servidor.server-settings.audit-log-section.avatar"
          id={entrada.actor.id}
          name={entrada.actor.displayName}
          url={entrada.actor.avatarUrl}
          size={24}
        />

        <span data-gc="servidor.server-settings.audit-log-section.span--2" className="min-w-0 flex-1">
          <span data-gc="servidor.server-settings.audit-log-section.span--3" className="block truncate text-sm">
            <strong data-gc="servidor.server-settings.audit-log-section.strong" className="font-medium text-ink">
              {entrada.actor.displayName}
            </strong>{" "}
            {frase}
          </span>
          <span data-gc="servidor.server-settings.audit-log-section.span--4" className="block text-xs text-ink-faint">
            {formatTimestamp(entrada.createdAt)}
          </span>
        </span>
      </button>

      {aberto && (
        <div data-gc="servidor.server-settings.audit-log-section.div--4" className="border-t border-line px-3 py-2 text-xs text-ink-muted">
          {entrada.reason && (
            <p data-gc="servidor.server-settings.audit-log-section.p--3" className="mb-1">
              <span data-gc="servidor.server-settings.audit-log-section.span--5" className="text-ink-faint">{t("servidor.auditoria.motivo")}</span> {entrada.reason}
            </p>
          )}

          {mudancas.map(([campo, valor]) => (
            <p data-gc="servidor.server-settings.audit-log-section.p--4" key={campo}>
              <span data-gc="servidor.server-settings.audit-log-section.span--6" className="text-ink-faint">{campo}:</span>{" "}
              {formatar(valor.de)} → {formatar(valor.para)}
            </p>
          ))}
        </div>
      )}
    </article>
  );
};

const formatar = (valor: unknown) => {
  if (valor === null || valor === undefined || valor === "") return "vazio";
  if (Array.isArray(valor)) return valor.length ? valor.join(", ") : "vazio";
  if (typeof valor === "boolean") return valor ? "sim" : "não";

  return String(valor);
};
