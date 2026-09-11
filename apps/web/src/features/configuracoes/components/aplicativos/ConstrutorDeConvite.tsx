import React, { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@gravae/shared";

import { Label, bareField, fieldGroup } from "~/components/ui/input";
import { SecretField } from "~/features/configuracoes/components/aplicativos/comum";
import { cn } from "~/lib/utils";

const PRESETS: { name: string; description: string; permissions: Permission[] }[] = [
  {
    name: "Ler e responder",
    description: "O básico de um bot de comandos",
    permissions: [
      "VIEW_CHANNEL",
      "SEND_MESSAGES",
      "READ_MESSAGE_HISTORY",
      "ADD_REACTIONS",
      "ATTACH_FILES",
    ],
  },
  {
    name: "Música",
    description: "Entra no canal de voz e toca",
    permissions: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK"],
  },
  {
    name: "Moderação",
    description: "Expulsa, bane e limpa mensagens",
    permissions: [
      "VIEW_CHANNEL",
      "SEND_MESSAGES",
      "READ_MESSAGE_HISTORY",
      "MANAGE_MESSAGES",
      "KICK_MEMBERS",
      "BAN_MEMBERS",
      "MODERATE_MEMBERS",
      "VIEW_AUDIT_LOG",
    ],
  },
];

interface InvitePropsBuilder {
  link: string;
  picked: Permission[];
  onChange: (p: Permission[]) => void;
}

export const InviteBuilder: React.FC<InvitePropsBuilder> = ({
  link,
  picked,
  onChange,
}) => {
  const [search, setSearch] = useState("");

  const term = search.toLowerCase().trim();

  const groups = useMemo(
    () =>
      PERMISSION_GROUPS.map((group) => ({
        ...group,
        permissions: group.permissions.filter(
          (p) => !term || (PERMISSION_LABELS[p]?.name ?? p).toLowerCase().includes(term),
        ),
      })).filter((g) => g.permissions.length),
    [term],
  );

  const toggle = (permission: Permission) =>
    onChange(
      picked.includes(permission)
        ? picked.filter((p) => p !== permission)
        : [...picked, permission],
    );

  const equal = (preset: Permission[]) =>
    preset.length === picked.length && preset.every((p) => picked.includes(p));

  return (
    <>
      <div data-gc="configuracoes.aplicativos.construtor-de-convite.div">
        <Label data-gc="configuracoes.aplicativos.construtor-de-convite.label">Link de convite</Label>
        <SecretField data-gc="configuracoes.aplicativos.construtor-de-convite.secret-field"
          value={link}
          labelCopy="Copiar o link de convite"
          noticeCopied="Link copiado."
          mono={false}
        />
        <p data-gc="configuracoes.aplicativos.construtor-de-convite.p" className="mt-1.5 text-xs text-ink-faint">
          Mande pra quem tem servidor. Quem abrir escolhe onde põe o bot, e vê
          exatamente estas permissões.
        </p>
      </div>

      <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--2">
        <Label data-gc="configuracoes.aplicativos.construtor-de-convite.label--2">Permissões pedidas · {picked.length}</Label>

        <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--3" className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button data-gc="configuracoes.aplicativos.construtor-de-convite.button"
              key={preset.name}
              type="button"
              onClick={() => onChange(preset.permissions)}
              title={preset.description}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                equal(preset.permissions)
                  ? "border-brand bg-brand/15 text-ink"
                  : "border-line text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              {preset.name}
            </button>
          ))}

          {picked.length > 0 && (
            <button data-gc="configuracoes.aplicativos.construtor-de-convite.button--2"
              type="button"
              onClick={() => onChange([])}
              className="rounded-full px-3 py-1 text-xs text-ink-faint transition hover:text-danger"
            >
              Limpar
            </button>
          )}
        </div>

        <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--4" className={cn(fieldGroup, "mt-3")}>
          <Search data-gc="configuracoes.aplicativos.construtor-de-convite.search" size={14} className="shrink-0 text-ink-faint" />
          <input data-gc="configuracoes.aplicativos.construtor-de-convite.input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar permissão"
            aria-label="Procurar permissão"
            className={bareField}
          />
          {search && (
            <button data-gc="configuracoes.aplicativos.construtor-de-convite.button--3"
              type="button"
              onClick={() => setSearch("")}
              aria-label="Limpar a busca"
              className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
            >
              <X data-gc="configuracoes.aplicativos.construtor-de-convite.x" size={14} />
            </button>
          )}
        </div>

        <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--5" className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
          {groups.map((group) => (
            <section data-gc="configuracoes.aplicativos.construtor-de-convite.section" key={group.label}>
              <p data-gc="configuracoes.aplicativos.construtor-de-convite.p--2" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {group.label}
              </p>

              <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--6" className="grid gap-1 sm:grid-cols-2">
                {group.permissions.map((permission) => {
                  const marked = picked.includes(permission);
                  const heavy = permission === "ADMINISTRATOR";

                  return (
                    <button data-gc="configuracoes.aplicativos.construtor-de-convite.button--4"
                      key={permission}
                      type="button"
                      onClick={() => toggle(permission)}
                      title={PERMISSION_LABELS[permission]?.description}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                        marked ? "bg-surface-3 text-ink" : "text-ink-muted hover:bg-surface-3/60",
                      )}
                    >
                      <span data-gc="configuracoes.aplicativos.construtor-de-convite.span"
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border transition",
                          marked
                            ? heavy
                              ? "border-danger bg-danger text-sobre-marca"
                              : "border-brand bg-brand text-sobre-marca"
                            : "border-ink-faint",
                        )}
                      >
                        {marked && <Check data-gc="configuracoes.aplicativos.construtor-de-convite.check" size={11} strokeWidth={3} />}
                      </span>

                      <span data-gc="configuracoes.aplicativos.construtor-de-convite.span--2" className={cn("min-w-0 truncate", heavy && marked && "text-danger")}>
                        {PERMISSION_LABELS[permission]?.name ?? permission}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {!groups.length && (
            <p data-gc="configuracoes.aplicativos.construtor-de-convite.p--3" className="py-6 text-center text-sm text-ink-faint">
              Nenhuma permissão com esse nome.
            </p>
          )}
        </div>

        {picked.includes("ADMINISTRATOR") && (
          <p data-gc="configuracoes.aplicativos.construtor-de-convite.p--4" className="mt-3 rounded border border-danger/40 bg-danger-fundo px-3 py-2 text-xs text-ink-muted">
            Com <strong data-gc="configuracoes.aplicativos.construtor-de-convite.strong" className="text-danger">Administrador</strong>, o bot pode tudo —
            inclusive apagar canais e banir gente. Só marque se você escreveu o código dele.
          </p>
        )}
      </div>
    </>
  );
};
