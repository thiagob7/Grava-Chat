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
import { Avatar } from "~/components/Avatar";
import { formatTimestamp } from "~/lib/format";

interface AuditLogSectionProps {
  guildId: string;
  members: GuildMember[];
}

/** Cada ação vira uma frase em português — "role.create" não diz nada a ninguém. */
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
  { valor: "", label: "Todas as ações" },
  { valor: "member", label: "Membros" },
  { valor: "role", label: "Cargos" },
  { valor: "channel", label: "Canais" },
  { valor: "emoji", label: "Emojis" },
  { valor: "automod", label: "AutoMod" },
  { valor: "guild", label: "Servidor" },
];

export const AuditLogSection: React.FC<AuditLogSectionProps> = ({ guildId, members }) => {
  const [actorId, setActorId] = useState("");
  const [action, setAction] = useState("");

  const { data, isLoading } = useFindAuditLog(guildId, {
    ...(actorId ? { actorId } : {}),
    ...(action ? { action } : {}),
  });

  return (
    <div className="max-w-3xl pb-10">
      <div className="flex items-end gap-4">
        <h2 className="flex-1 text-xl font-semibold">Registro de auditoria</h2>

        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Filtrar por usuário
          <select
            value={actorId}
            onChange={(e) => setActorId(e.target.value)}
            className="mt-1 block w-44 rounded bg-surface-0 px-3 py-2 text-sm font-normal normal-case text-ink outline-none ring-brand/60 focus:ring-2"
          >
            <option value="">Todos os usuários</option>
            {members.map((m) => (
              <option key={m.id} value={m.user.id}>
                {m.user.displayName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
          Filtrar por ação
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="mt-1 block w-40 rounded bg-surface-0 px-3 py-2 text-sm font-normal normal-case text-ink outline-none ring-brand/60 focus:ring-2"
          >
            {FILTROS.map((f) => (
              <option key={f.valor} value={f.valor}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 space-y-2">
        {isLoading && <p className="text-sm text-ink-faint">Carregando…</p>}

        {!isLoading && !data?.entries.length && (
          <p className="py-10 text-center text-sm text-ink-faint">
            Nada registrado ainda com esse filtro.
          </p>
        )}

        {(data?.entries ?? []).map((entrada) => (
          <Entrada key={entrada.id} entrada={entrada} />
        ))}
      </div>
    </div>
  );
};

const Entrada: React.FC<{ entrada: AuditEntryModel }> = ({ entrada }) => {
  const [aberto, setAberto] = useState(false);
  const Icone = ICONES[entrada.targetType] ?? (entrada.action.includes("ban") ? Ban : Trash2);

  const frase =
    FRASES[entrada.action]?.(entrada.targetName ?? "algo") ??
    `${entrada.action} ${entrada.targetName ?? ""}`;

  const mudancas = Object.entries(entrada.changes ?? {});

  return (
    <article className="rounded-lg bg-surface-1">
      <button
        onClick={() => setAberto((v) => !v)}
        disabled={!mudancas.length && !entrada.reason}
        className="flex w-full items-center gap-3 p-3 text-left"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-0 text-ink-muted">
          <Icone size={16} />
        </span>

        <Avatar
          id={entrada.actor.id}
          name={entrada.actor.displayName}
          url={entrada.actor.avatarUrl}
          size={24}
        />

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm">
            <strong className="font-medium text-ink">{entrada.actor.displayName}</strong> {frase}
          </span>
          <span className="block text-xs text-ink-faint">{formatTimestamp(entrada.createdAt)}</span>
        </span>
      </button>

      {aberto && (
        <div className="border-t border-line px-3 py-2 text-xs text-ink-muted">
          {entrada.reason && (
            <p className="mb-1">
              <span className="text-ink-faint">Motivo:</span> {entrada.reason}
            </p>
          )}

          {mudancas.map(([campo, valor]) => (
            <p key={campo}>
              <span className="text-ink-faint">{campo}:</span> {formatar(valor.de)} →{" "}
              {formatar(valor.para)}
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
