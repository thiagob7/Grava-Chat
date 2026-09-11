import React, { useState } from "react";
import { Checkbox } from "~/components/ui/checkbox";
import {
  AtSign,
  Link2,
  Plus,
  ShieldAlert,
  TextCursorInput,
  Trash2,
} from "lucide-react";
import type { Channel, Role } from "@gravae/shared";

import {
  useDeleteAutoModRule,
  useFindAutoModRules,
  useSaveAutoModRule,
} from "~/@core/application/queries/moderation/use-moderation";
import type { AutoModRuleModel } from "~/@core/application/requests/moderation/moderation";
import { Button } from "~/components/ui/button";
import { SelectField } from "~/components/ui/select";
import { Input, Label } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useConfirm } from "~/components/ui/confirm";
import { cn } from "~/lib/utils";
import { i18next, useTranslation } from "~/traducao";

interface AutoModSectionProps {
  guildId: string;
  channels: Channel[];
  roles: Role[];
}

const TRIGGERS = [
  {
    value: "WORDS" as const,
    icon: TextCursorInput,
    title: "servidor.automod.palavras.titulo",
    description: "servidor.automod.palavras.descricao",
  },
  {
    value: "MENTION_SPAM" as const,
    icon: AtSign,
    title: "servidor.automod.mencoes.titulo",
    description: "servidor.automod.mencoes.descricao",
  },
  {
    value: "LINKS" as const,
    icon: Link2,
    title: "servidor.automod.links.titulo",
    description: "servidor.automod.links.descricao",
  },
];

const newRule = (
  trigger: AutoModRuleModel["trigger"],
): Omit<AutoModRuleModel, "id" | "guildId"> => ({
  name: i18next.t(TRIGGERS.find((g) => g.value === trigger)!.title),
  enabled: true,
  trigger,
  words: [],
  limitMentions: trigger === "MENTION_SPAM" ? 5 : null,
  actions: ["BLOCK"],
  alertChannelId: null,
  timeoutSeconds: null,
  rolesExempt: [],
});

export const AutoModSection: React.FC<AutoModSectionProps> = ({
  guildId,
  channels,
  roles,
}) => {
  const { t } = useTranslation();
  const { data: rules = [] } = useFindAutoModRules(guildId);
  const save = useSaveAutoModRule(guildId);
  const confirm = useConfirm();
  const doDelete = useDeleteAutoModRule(guildId);
  const [editing, setEditing] = useState<AutoModRuleModel | null>(null);

  const textChannels = channels.filter((c) => c.type === "TEXT");

  return (
    <div data-gc="servidor.server-settings.auto-mod-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.auto-mod-section.h2" className="text-xl font-semibold">{t("servidor.automod.titulo")}</h2>
      <p data-gc="servidor.server-settings.auto-mod-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.automod.descricao")}
      </p>

      <section data-gc="servidor.server-settings.auto-mod-section.section" className="mt-6 space-y-3">
        {TRIGGERS.map((trigger) => {
          const existing = rules.find((r) => r.trigger === trigger.value);

          return (
            <div data-gc="servidor.server-settings.auto-mod-section.div--2" key={trigger.value} className="rounded-lg bg-surface-1 p-4">
              <div data-gc="servidor.server-settings.auto-mod-section.div--3" className="flex items-start gap-3">
                <trigger.icon data-gc="servidor.server-settings.auto-mod-section.triggericon"
                  size={20}
                  className="mt-0.5 shrink-0 text-ink-faint"
                />

                <div data-gc="servidor.server-settings.auto-mod-section.div--4" className="min-w-0 flex-1">
                  <p data-gc="servidor.server-settings.auto-mod-section.p--2" className="text-sm font-semibold">{t(trigger.title)}</p>
                  <p data-gc="servidor.server-settings.auto-mod-section.p--3" className="mt-0.5 text-xs text-ink-faint">
                    {t(trigger.description)}
                  </p>

                  {existing && (
                    <div data-gc="servidor.server-settings.auto-mod-section.div--5" className="mt-2 flex flex-wrap gap-1">
                      {existing.actions.map((action) => (
                        <span data-gc="servidor.server-settings.auto-mod-section.span"
                          key={action}
                          className="rounded bg-surface-0 px-1.5 py-0.5 text-10 uppercase text-ink-faint"
                        >
                          {action === "BLOCK"
                            ? "bloquear mensagem"
                            : action === "ALERT"
                              ? "enviar alerta"
                              : "castigo"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {existing ? (
                  <div data-gc="servidor.server-settings.auto-mod-section.div--6" className="flex shrink-0 items-center gap-2">
                    <Switch data-gc="servidor.server-settings.auto-mod-section.switch"
                      checked={existing.enabled}
                      onCheckedChange={(v) =>
                        save.mutate({
                          ...existing,
                          guildId,
                          ruleId: existing.id,
                          enabled: v,
                        })
                      }
                    />
                    <Button data-gc="servidor.server-settings.auto-mod-section.button"
                      variant="surface"
                      size="sm"
                      onClick={() => setEditing(existing)}
                    >
                      {t("servidor.automod.definir")}
                    </Button>
                    <button data-gc="servidor.server-settings.auto-mod-section.button--2"
                      onClick={() =>
                        void confirm({
                          title: t("servidor.automod.excluirTitulo"),
                          description:
                            t("servidor.automod.excluirDescricao"),
                          action: t("servidor.automod.excluirAcao"),
                        }).then(
                          ({ confirmed }) =>
                            confirmed &&
                            doDelete.mutate({ guildId, ruleId: existing.id }),
                        )
                      }
                      title={t("servidor.automod.apagar")}
                      className="rounded p-1.5 text-ink-faint transition hover:text-danger"
                    >
                      <Trash2 data-gc="servidor.server-settings.auto-mod-section.trash2" size={16} />
                    </button>
                  </div>
                ) : (
                  <Button data-gc="servidor.server-settings.auto-mod-section.button--3"
                    size="sm"
                    onClick={() =>
                      setEditing({
                        ...newRule(trigger.value),
                        id: "",
                        guildId,
                      })
                    }
                  >
                    <Plus data-gc="servidor.server-settings.auto-mod-section.plus" size={14} /> {t("comum.criar")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {editing && (
        <RuleEditor data-gc="servidor.server-settings.auto-mod-section.rule-editor"
          rule={editing}
          guildId={guildId}
          channels={textChannels}
          roles={roles}
          onClose={() => setEditing(null)}
          onSave={(rule) =>
            save.mutate(
              { ...rule, guildId, ruleId: rule.id || undefined },
              { onSuccess: () => setEditing(null) },
            )
          }
        />
      )}
    </div>
  );
};

interface EditorProps {
  rule: AutoModRuleModel;
  guildId: string;
  channels: Channel[];
  roles: Role[];
  onClose: () => void;
  onSave: (rule: AutoModRuleModel) => void;
}

const RuleEditor: React.FC<EditorProps> = ({
  rule,
  channels,
  roles,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(rule);
  const [word, setWord] = useState("");

  const toggleAction = (action: AutoModRuleModel["actions"][number]) =>
    setDraft((current) => ({
      ...current,
      actions: current.actions.includes(action)
        ? current.actions.filter((a) => a !== action)
        : [...current.actions, action],
    }));

  return (
    <div data-gc="servidor.server-settings.auto-mod-section.div--7" className="mt-6 rounded-lg border border-brand/40 bg-surface-1 p-5">
      <h3 data-gc="servidor.server-settings.auto-mod-section.h3" className="flex items-center gap-2 font-semibold">
        <ShieldAlert data-gc="servidor.server-settings.auto-mod-section.shield-alert" size={18} /> {draft.name}
      </h3>

      <div data-gc="servidor.server-settings.auto-mod-section.div--8" className="mt-4 space-y-4">
        <div data-gc="servidor.server-settings.auto-mod-section.div--9">
          <Label data-gc="servidor.server-settings.auto-mod-section.label" htmlFor="regra-nome">{t("servidor.automod.nomeDaRegra")}</Label>
          <Input data-gc="servidor.server-settings.auto-mod-section.input"
            id="regra-nome"
            value={draft.name}
            maxLength={48}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
        </div>

        {draft.trigger === "WORDS" && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--10">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--2" htmlFor="regra-palavra">{t("servidor.automod.bloqueadas")}</Label>
            <div data-gc="servidor.server-settings.auto-mod-section.div--11" className="flex gap-2">
              <Input data-gc="servidor.server-settings.auto-mod-section.input--2"
                id="regra-palavra"
                value={word}
                placeholder={t("servidor.automod.digiteEnter")}
                onChange={(e) => setWord(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !word.trim()) return;
                  e.preventDefault();

                  setDraft((current) => ({
                    ...current,
                    words: [
                      ...new Set([
                        ...current.words,
                        word.trim().toLowerCase(),
                      ]),
                    ],
                  }));
                  setWord("");
                }}
              />
            </div>

            <div data-gc="servidor.server-settings.auto-mod-section.div--12" className="mt-2 flex flex-wrap gap-1.5">
              {draft.words.map((p) => (
                <button data-gc="servidor.server-settings.auto-mod-section.button--4"
                  key={p}
                  onClick={() =>
                    setDraft((current) => ({
                      ...current,
                      words: current.words.filter((x) => x !== p),
                    }))
                  }
                  className="rounded bg-surface-0 px-2 py-1 text-xs text-ink-muted transition hover:text-danger"
                >
                  {p} ✕
                </button>
              ))}
            </div>

            <p data-gc="servidor.server-settings.auto-mod-section.p--4" className="mt-2 text-xs text-ink-faint">
              {t("servidor.automod.comparacao")}
            </p>
          </div>
        )}

        {draft.trigger === "MENTION_SPAM" && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--13">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--3" htmlFor="regra-mencoes">
              {t("servidor.automod.aPartirDe")}
            </Label>
            <Input data-gc="servidor.server-settings.auto-mod-section.input--3"
              id="regra-mencoes"
              type="number"
              min={2}
              max={50}
              value={draft.limitMentions ?? 5}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  limitMentions: Number(e.target.value),
                })
              }
            />
          </div>
        )}

        <div data-gc="servidor.server-settings.auto-mod-section.div--14">
          <Label data-gc="servidor.server-settings.auto-mod-section.label--4">{t("servidor.automod.oQueFazer")}</Label>
          <div data-gc="servidor.server-settings.auto-mod-section.div--15" className="space-y-2">
            {(
              [
                ["BLOCK", "Bloquear a mensagem"],
                ["ALERT", "Avisar num canal"],
                ["TIMEOUT", "Deixar de castigo"],
              ] as const
            ).map(([action, label]) => (
              <label data-gc="servidor.server-settings.auto-mod-section.label--5"
                key={action}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition",
                  draft.actions.includes(action)
                    ? "bg-surface-4"
                    : "bg-surface-0 hover:bg-surface-4/60",
                )}
              >
                <Checkbox data-gc="servidor.server-settings.auto-mod-section.checkbox"
                  checked={draft.actions.includes(action)}
                  onChange={() => toggleAction(action)}
                />
                <span data-gc="servidor.server-settings.auto-mod-section.span--2" className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {draft.actions.includes("ALERT") && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--16">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--6" htmlFor="regra-canal">{t("servidor.automod.canalDoAlerta")}</Label>
            <SelectField data-gc="servidor.server-settings.auto-mod-section.select-field"
              id="regra-canal"
              value={draft.alertChannelId ?? ""}
              onSelect={(id) =>
                setDraft({ ...draft, alertChannelId: id || null })
              }
              options={[
                { value: "", label: t("servidor.automod.escolhaCanal") },
                ...channels.map((channel) => ({
                  value: channel.id,
                  label: `#${channel.name}`,
                })),
              ]}
            />
          </div>
        )}

        {draft.actions.includes("TIMEOUT") && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--17">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--7" htmlFor="regra-castigo">{t("servidor.automod.castigo")}</Label>
            <Input data-gc="servidor.server-settings.auto-mod-section.input--4"
              id="regra-castigo"
              type="number"
              min={1}
              max={10080}
              value={(draft.timeoutSeconds ?? 300) / 60}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  timeoutSeconds: Number(e.target.value) * 60,
                })
              }
            />
          </div>
        )}

        <div data-gc="servidor.server-settings.auto-mod-section.div--18">
          <Label data-gc="servidor.server-settings.auto-mod-section.label--8">{t("servidor.automod.isentos")}</Label>
          <div data-gc="servidor.server-settings.auto-mod-section.div--19" className="flex flex-wrap gap-1.5">
            {roles
              .filter((r) => !r.isEveryone)
              .map((role) => {
                const exempt = draft.rolesExempt.includes(role.id);

                return (
                  <button data-gc="servidor.server-settings.auto-mod-section.button--5"
                    key={role.id}
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        rolesExempt: exempt
                          ? current.rolesExempt.filter((id) => id !== role.id)
                          : [...current.rolesExempt, role.id],
                      }))
                    }
                    className={cn(
                      "rounded px-2 py-1 text-xs transition",
                      exempt
                        ? "bg-brand text-sobre-marca"
                        : "bg-surface-0 text-ink-muted hover:text-ink",
                    )}
                  >
                    {role.name}
                  </button>
                );
              })}

            {roles.filter((r) => !r.isEveryone).length === 0 && (
              <p data-gc="servidor.server-settings.auto-mod-section.p--5" className="text-xs text-ink-faint">
                {t("servidor.automod.semCargos")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div data-gc="servidor.server-settings.auto-mod-section.div--20" className="mt-5 flex gap-2">
        <Button data-gc="servidor.server-settings.auto-mod-section.button--6"
          variant="success"
          size="sm"
          disabled={!draft.actions.length}
          onClick={() => onSave(draft)}
        >
          {t("servidor.automod.salvarRegra")}
        </Button>
        <Button data-gc="servidor.server-settings.auto-mod-section.button.on-close" variant="ghost" size="sm" onClick={onClose}>
          {t("comum.cancelar")}
        </Button>
      </div>
    </div>
  );
};
