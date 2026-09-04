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

/*
  A lista guarda a CHAVE, não a frase.

  Ela é uma constante de módulo: se chamasse `t()` aqui, a tradução seria
  resolvida uma vez, na hora de carregar o arquivo — antes de o idioma estar
  pronto, e congelada para sempre depois. Quem desenha é que traduz.
*/
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
  /// O nome da regra é gravado no banco: aqui a frase precisa existir de
  /// verdade, e `i18next.t` resolve no idioma de quem clicou.
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
    <div className="max-w-2xl pb-10">
      <h2 className="text-xl font-semibold">{t("servidor.automod.titulo")}</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {t("servidor.automod.descricao")}
      </p>

      <section className="mt-6 space-y-3">
        {GATILHOS.map((gatilho) => {
          const existente = regras.find((r) => r.trigger === gatilho.valor);

          return (
            <div key={gatilho.valor} className="rounded-lg bg-surface-1 p-4">
              <div className="flex items-start gap-3">
                <gatilho.icone
                  size={20}
                  className="mt-0.5 shrink-0 text-ink-faint"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t(gatilho.titulo)}</p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {t(gatilho.descricao)}
                  </p>

                  {existente && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {existente.acoes.map((acao) => (
                        <span
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
                  <div className="flex shrink-0 items-center gap-2">
                    <Switch
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
                    <Button
                      variant="surface"
                      size="sm"
                      onClick={() => setEditando(existente)}
                    >
                      {t("servidor.automod.definir")}
                    </Button>
                    <button
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
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() =>
                      setEditando({
                        ...novaRegra(gatilho.valor),
                        id: "",
                        guildId,
                      })
                    }
                  >
                    <Plus size={14} /> {t("comum.criar")}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {editando && (
        <EditorDeRegra
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
    <div className="mt-6 rounded-lg border border-brand/40 bg-surface-1 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <ShieldAlert size={18} /> {rascunho.name}
      </h3>

      <div className="mt-4 space-y-4">
        <div>
          <Label htmlFor="regra-nome">{t("servidor.automod.nomeDaRegra")}</Label>
          <Input
            id="regra-nome"
            value={rascunho.name}
            maxLength={48}
            onChange={(e) => setRascunho({ ...rascunho, name: e.target.value })}
          />
        </div>

        {rascunho.trigger === "WORDS" && (
          <div>
            <Label htmlFor="regra-palavra">{t("servidor.automod.bloqueadas")}</Label>
            <div className="flex gap-2">
              <Input
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

            <div className="mt-2 flex flex-wrap gap-1.5">
              {rascunho.palavras.map((p) => (
                <button
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

            <p className="mt-2 text-xs text-ink-faint">
              {t("servidor.automod.comparacao")}
            </p>
          </div>
        )}

        {rascunho.trigger === "MENTION_SPAM" && (
          <div>
            <Label htmlFor="regra-mencoes">
              {t("servidor.automod.aPartirDe")}
            </Label>
            <Input
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

        <div>
          <Label>{t("servidor.automod.oQueFazer")}</Label>
          <div className="space-y-2">
            {(
              [
                ["BLOCK", "Bloquear a mensagem"],
                ["ALERT", "Avisar num canal"],
                ["TIMEOUT", "Deixar de castigo"],
              ] as const
            ).map(([acao, rotulo]) => (
              <label
                key={acao}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded px-3 py-2 transition",
                  rascunho.acoes.includes(acao)
                    ? "bg-surface-4"
                    : "bg-surface-0 hover:bg-surface-4/60",
                )}
              >
                <Checkbox
                  checked={rascunho.acoes.includes(acao)}
                  onChange={() => alternarAcao(acao)}
                />
                <span className="text-sm">{rotulo}</span>
              </label>
            ))}
          </div>
        </div>

        {rascunho.acoes.includes("ALERT") && (
          <div>
            <Label htmlFor="regra-canal">{t("servidor.automod.canalDoAlerta")}</Label>
            <CampoSelect
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
          <div>
            <Label htmlFor="regra-castigo">{t("servidor.automod.castigo")}</Label>
            <Input
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

        <div>
          <Label>{t("servidor.automod.isentos")}</Label>
          <div className="flex flex-wrap gap-1.5">
            {roles
              .filter((r) => !r.isEveryone)
              .map((role) => {
                const isento = rascunho.cargosIsentos.includes(role.id);

                return (
                  <button
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
              <p className="text-xs text-ink-faint">
                {t("servidor.automod.semCargos")}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-2">
        <Button
          variant="success"
          size="sm"
          disabled={!rascunho.acoes.length}
          onClick={() => onSalvar(rascunho)}
        >
          {t("servidor.automod.salvarRegra")}
        </Button>
        <Button variant="ghost" size="sm" onClick={onFechar}>
          {t("comum.cancelar")}
        </Button>
      </div>
    </div>
  );
};
