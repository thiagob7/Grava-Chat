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
import { CampoSelect } from "~/components/ui/select";
import { Input, Label } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { useConfirmar } from "~/components/ui/confirm";
import { cn } from "~/lib/utils";
import { i18next, useTranslation } from "~/traducao";

interface AutoModSectionProps {
  guildId: string;
  channels: Channel[];
  roles: Role[];
}

const GATILHOS = [
  {
    valor: "WORDS" as const,
    icone: TextCursorInput,
    titulo: "servidor.automod.palavras.titulo",
    descricao: "servidor.automod.palavras.descricao",
  },
  {
    valor: "MENTION_SPAM" as const,
    icone: AtSign,
    titulo: "servidor.automod.mencoes.titulo",
    descricao: "servidor.automod.mencoes.descricao",
  },
  {
    valor: "LINKS" as const,
    icone: Link2,
    titulo: "servidor.automod.links.titulo",
    descricao: "servidor.automod.links.descricao",
  },
];

const novaRegra = (
  trigger: AutoModRuleModel["trigger"],
): Omit<AutoModRuleModel, "id" | "guildId"> => ({
  name: i18next.t(GATILHOS.find((g) => g.valor === trigger)!.titulo),
  enabled: true,
  trigger,
  palavras: [],
  limiteMencoes: trigger === "MENTION_SPAM" ? 5 : null,
  acoes: ["BLOCK"],
  alertChannelId: null,
  timeoutSeconds: null,
  cargosIsentos: [],
});

export const AutoModSection: React.FC<AutoModSectionProps> = ({
  guildId,
  channels,
  roles,
}) => {
  const { t } = useTranslation();
  const { data: regras = [] } = useFindAutoModRules(guildId);
  const salvar = useSaveAutoModRule(guildId);
  const confirmar = useConfirmar();
  const apagar = useDeleteAutoModRule(guildId);
  const [editando, setEditando] = useState<AutoModRuleModel | null>(null);

  const canaisDeTexto = channels.filter((c) => c.type === "TEXT");

  return (
    <div data-gc="servidor.server-settings.auto-mod-section.div" className="max-w-2xl pb-10">
      <h2 data-gc="servidor.server-settings.auto-mod-section.h2" className="text-xl font-semibold">{t("servidor.automod.titulo")}</h2>
      <p data-gc="servidor.server-settings.auto-mod-section.p" className="mt-1 text-sm text-ink-muted">
        {t("servidor.automod.descricao")}
      </p>

      <section data-gc="servidor.server-settings.auto-mod-section.section" className="mt-6 space-y-3">
        {GATILHOS.map((gatilho) => {
          const existente = regras.find((r) => r.trigger === gatilho.valor);

          return (
            <div data-gc="servidor.server-settings.auto-mod-section.div--2" key={gatilho.valor} className="rounded-lg bg-surface-1 p-4">
              <div data-gc="servidor.server-settings.auto-mod-section.div--3" className="flex items-start gap-3">
                <gatilho.icone data-gc="servidor.server-settings.auto-mod-section.gatilhoicone"
                  size={20}
                  className="mt-0.5 shrink-0 text-ink-faint"
                />

                <div data-gc="servidor.server-settings.auto-mod-section.div--4" className="min-w-0 flex-1">
                  <p data-gc="servidor.server-settings.auto-mod-section.p--2" className="text-sm font-semibold">{t(gatilho.titulo)}</p>
                  <p data-gc="servidor.server-settings.auto-mod-section.p--3" className="mt-0.5 text-xs text-ink-faint">
                    {t(gatilho.descricao)}
                  </p>

                  {existente && (
                    <div data-gc="servidor.server-settings.auto-mod-section.div--5" className="mt-2 flex flex-wrap gap-1">
                      {existente.acoes.map((acao) => (
                        <span data-gc="servidor.server-settings.auto-mod-section.span"
                          key={acao}
                          className="rounded bg-surface-0 px-1.5 py-0.5 text-10 uppercase text-ink-faint"
                        >
                          {acao === "BLOCK"
                            ? "bloquear mensagem"
                            : acao === "ALERT"
                              ? "enviar alerta"
                              : "castigo"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {existente ? (
                  <div data-gc="servidor.server-settings.auto-mod-section.div--6" className="flex shrink-0 items-center gap-2">
                    <Switch data-gc="servidor.server-settings.auto-mod-section.switch"
                      checked={existente.enabled}
                      onCheckedChange={(v) =>
                        salvar.mutate({
                          ...existente,
                          guildId,
                          ruleId: existente.id,
                          enabled: v,
                        })
                      }
                    />
                    <Button data-gc="servidor.server-settings.auto-mod-section.button"
                      variant="surface"
                      size="sm"
                      onClick={() => setEditando(existente)}
                    >
                      {t("servidor.automod.definir")}
                    </Button>
                    <button data-gc="servidor.server-settings.auto-mod-section.button--2"
                      onClick={() =>
                        void confirmar({
                          titulo: t("servidor.automod.excluirTitulo"),
                          descricao:
                            t("servidor.automod.excluirDescricao"),
                          acao: t("servidor.automod.excluirAcao"),
                        }).then(
                          ({ confirmado }) =>
                            confirmado &&
                            apagar.mutate({ guildId, ruleId: existente.id }),
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
                      setEditando({
                        ...novaRegra(gatilho.valor),
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

      {editando && (
        <EditorDeRegra data-gc="servidor.server-settings.auto-mod-section.editor-de-regra"
          regra={editando}
          guildId={guildId}
          canais={canaisDeTexto}
          roles={roles}
          onFechar={() => setEditando(null)}
          onSalvar={(regra) =>
            salvar.mutate(
              { ...regra, guildId, ruleId: regra.id || undefined },
              { onSuccess: () => setEditando(null) },
            )
          }
        />
      )}
    </div>
  );
};

interface EditorProps {
  regra: AutoModRuleModel;
  guildId: string;
  canais: Channel[];
  roles: Role[];
  onFechar: () => void;
  onSalvar: (regra: AutoModRuleModel) => void;
}

const EditorDeRegra: React.FC<EditorProps> = ({
  regra,
  canais,
  roles,
  onFechar,
  onSalvar,
}) => {
  const { t } = useTranslation();
  const [rascunho, setRascunho] = useState(regra);
  const [palavra, setPalavra] = useState("");

  const alternarAcao = (acao: AutoModRuleModel["acoes"][number]) =>
    setRascunho((atual) => ({
      ...atual,
      acoes: atual.acoes.includes(acao)
        ? atual.acoes.filter((a) => a !== acao)
        : [...atual.acoes, acao],
    }));

  return (
    <div data-gc="servidor.server-settings.auto-mod-section.div--7" className="mt-6 rounded-lg border border-brand/40 bg-surface-1 p-5">
      <h3 data-gc="servidor.server-settings.auto-mod-section.h3" className="flex items-center gap-2 font-semibold">
        <ShieldAlert data-gc="servidor.server-settings.auto-mod-section.shield-alert" size={18} /> {rascunho.name}
      </h3>

      <div data-gc="servidor.server-settings.auto-mod-section.div--8" className="mt-4 space-y-4">
        <div data-gc="servidor.server-settings.auto-mod-section.div--9">
          <Label data-gc="servidor.server-settings.auto-mod-section.label" htmlFor="regra-nome">{t("servidor.automod.nomeDaRegra")}</Label>
          <Input data-gc="servidor.server-settings.auto-mod-section.input"
            id="regra-nome"
            value={rascunho.name}
            maxLength={48}
            onChange={(e) => setRascunho({ ...rascunho, name: e.target.value })}
          />
        </div>

        {rascunho.trigger === "WORDS" && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--10">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--2" htmlFor="regra-palavra">{t("servidor.automod.bloqueadas")}</Label>
            <div data-gc="servidor.server-settings.auto-mod-section.div--11" className="flex gap-2">
              <Input data-gc="servidor.server-settings.auto-mod-section.input--2"
                id="regra-palavra"
                value={palavra}
                placeholder={t("servidor.automod.digiteEnter")}
                onChange={(e) => setPalavra(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter" || !palavra.trim()) return;
                  e.preventDefault();

                  setRascunho((atual) => ({
                    ...atual,
                    palavras: [
                      ...new Set([
                        ...atual.palavras,
                        palavra.trim().toLowerCase(),
                      ]),
                    ],
                  }));
                  setPalavra("");
                }}
              />
            </div>

            <div data-gc="servidor.server-settings.auto-mod-section.div--12" className="mt-2 flex flex-wrap gap-1.5">
              {rascunho.palavras.map((p) => (
                <button data-gc="servidor.server-settings.auto-mod-section.button--4"
                  key={p}
                  onClick={() =>
                    setRascunho((atual) => ({
                      ...atual,
                      palavras: atual.palavras.filter((x) => x !== p),
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

        {rascunho.trigger === "MENTION_SPAM" && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--13">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--3" htmlFor="regra-mencoes">
              {t("servidor.automod.aPartirDe")}
            </Label>
            <Input data-gc="servidor.server-settings.auto-mod-section.input--3"
              id="regra-mencoes"
              type="number"
              min={2}
              max={50}
              value={rascunho.limiteMencoes ?? 5}
              onChange={(e) =>
                setRascunho({
                  ...rascunho,
                  limiteMencoes: Number(e.target.value),
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
            ).map(([acao, rotulo]) => (
              <label data-gc="servidor.server-settings.auto-mod-section.label--5"
                key={acao}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition",
                  rascunho.acoes.includes(acao)
                    ? "bg-surface-4"
                    : "bg-surface-0 hover:bg-surface-4/60",
                )}
              >
                <Checkbox data-gc="servidor.server-settings.auto-mod-section.checkbox"
                  checked={rascunho.acoes.includes(acao)}
                  onChange={() => alternarAcao(acao)}
                />
                <span data-gc="servidor.server-settings.auto-mod-section.span--2" className="text-sm">{rotulo}</span>
              </label>
            ))}
          </div>
        </div>

        {rascunho.acoes.includes("ALERT") && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--16">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--6" htmlFor="regra-canal">{t("servidor.automod.canalDoAlerta")}</Label>
            <CampoSelect data-gc="servidor.server-settings.auto-mod-section.campo-select"
              id="regra-canal"
              valor={rascunho.alertChannelId ?? ""}
              onEscolher={(id) =>
                setRascunho({ ...rascunho, alertChannelId: id || null })
              }
              opcoes={[
                { valor: "", rotulo: t("servidor.automod.escolhaCanal") },
                ...canais.map((canal) => ({
                  valor: canal.id,
                  rotulo: `#${canal.name}`,
                })),
              ]}
            />
          </div>
        )}

        {rascunho.acoes.includes("TIMEOUT") && (
          <div data-gc="servidor.server-settings.auto-mod-section.div--17">
            <Label data-gc="servidor.server-settings.auto-mod-section.label--7" htmlFor="regra-castigo">{t("servidor.automod.castigo")}</Label>
            <Input data-gc="servidor.server-settings.auto-mod-section.input--4"
              id="regra-castigo"
              type="number"
              min={1}
              max={10080}
              value={(rascunho.timeoutSeconds ?? 300) / 60}
              onChange={(e) =>
                setRascunho({
                  ...rascunho,
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
                const isento = rascunho.cargosIsentos.includes(role.id);

                return (
                  <button data-gc="servidor.server-settings.auto-mod-section.button--5"
                    key={role.id}
                    onClick={() =>
                      setRascunho((atual) => ({
                        ...atual,
                        cargosIsentos: isento
                          ? atual.cargosIsentos.filter((id) => id !== role.id)
                          : [...atual.cargosIsentos, role.id],
                      }))
                    }
                    className={cn(
                      "rounded px-2 py-1 text-xs transition",
                      isento
                        ? "bg-brand text-white"
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
          disabled={!rascunho.acoes.length}
          onClick={() => onSalvar(rascunho)}
        >
          {t("servidor.automod.salvarRegra")}
        </Button>
        <Button data-gc="servidor.server-settings.auto-mod-section.button.on-fechar" variant="ghost" size="sm" onClick={onFechar}>
          {t("comum.cancelar")}
        </Button>
      </div>
    </div>
  );
};
