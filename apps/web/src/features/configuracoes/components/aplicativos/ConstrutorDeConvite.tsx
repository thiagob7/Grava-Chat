import React, { useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import {
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  type Permission,
} from "@gravae/shared";

import { Label, campoNu, grupoDeCampo } from "~/components/ui/input";
import { CampoDeSegredo } from "~/features/configuracoes/components/aplicativos/comum";
import { cn } from "~/lib/utils";

const PRESETS: { nome: string; descricao: string; permissoes: Permission[] }[] = [
  {
    nome: "Ler e responder",
    descricao: "O básico de um bot de comandos",
    permissoes: [
      "VIEW_CHANNEL",
      "SEND_MESSAGES",
      "READ_MESSAGE_HISTORY",
      "ADD_REACTIONS",
      "ATTACH_FILES",
    ],
  },
  {
    nome: "Música",
    descricao: "Entra no canal de voz e toca",
    permissoes: ["VIEW_CHANNEL", "SEND_MESSAGES", "READ_MESSAGE_HISTORY", "CONNECT", "SPEAK"],
  },
  {
    nome: "Moderação",
    descricao: "Expulsa, bane e limpa mensagens",
    permissoes: [
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

interface ConstrutorDeConviteProps {
  link: string;
  escolhidas: Permission[];
  onMudar: (p: Permission[]) => void;
}

export const ConstrutorDeConvite: React.FC<ConstrutorDeConviteProps> = ({
  link,
  escolhidas,
  onMudar,
}) => {
  const [busca, setBusca] = useState("");

  const termo = busca.toLowerCase().trim();

  const grupos = useMemo(
    () =>
      PERMISSION_GROUPS.map((grupo) => ({
        ...grupo,
        permissions: grupo.permissions.filter(
          (p) => !termo || (PERMISSION_LABELS[p]?.nome ?? p).toLowerCase().includes(termo),
        ),
      })).filter((g) => g.permissions.length),
    [termo],
  );

  const alternar = (permissao: Permission) =>
    onMudar(
      escolhidas.includes(permissao)
        ? escolhidas.filter((p) => p !== permissao)
        : [...escolhidas, permissao],
    );

  const igual = (preset: Permission[]) =>
    preset.length === escolhidas.length && preset.every((p) => escolhidas.includes(p));

  return (
    <>
      <div data-gc="configuracoes.aplicativos.construtor-de-convite.div">
        <Label data-gc="configuracoes.aplicativos.construtor-de-convite.label">Link de convite</Label>
        <CampoDeSegredo data-gc="configuracoes.aplicativos.construtor-de-convite.campo-de-segredo"
          valor={link}
          rotuloCopiar="Copiar o link de convite"
          avisoCopiado="Link copiado."
          mono={false}
        />
        <p data-gc="configuracoes.aplicativos.construtor-de-convite.p" className="mt-1.5 text-xs text-ink-faint">
          Mande pra quem tem servidor. Quem abrir escolhe onde põe o bot, e vê
          exatamente estas permissões.
        </p>
      </div>

      <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--2">
        <Label data-gc="configuracoes.aplicativos.construtor-de-convite.label--2">Permissões pedidas · {escolhidas.length}</Label>

        <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--3" className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button data-gc="configuracoes.aplicativos.construtor-de-convite.button"
              key={preset.nome}
              type="button"
              onClick={() => onMudar(preset.permissoes)}
              title={preset.descricao}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                igual(preset.permissoes)
                  ? "border-brand bg-brand/15 text-ink"
                  : "border-line text-ink-muted hover:border-ink-faint hover:text-ink",
              )}
            >
              {preset.nome}
            </button>
          ))}

          {escolhidas.length > 0 && (
            <button data-gc="configuracoes.aplicativos.construtor-de-convite.button--2"
              type="button"
              onClick={() => onMudar([])}
              className="rounded-full px-3 py-1 text-xs text-ink-faint transition hover:text-danger"
            >
              Limpar
            </button>
          )}
        </div>

        <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--4" className={cn(grupoDeCampo, "mt-3")}>
          <Search data-gc="configuracoes.aplicativos.construtor-de-convite.search" size={14} className="shrink-0 text-ink-faint" />
          <input data-gc="configuracoes.aplicativos.construtor-de-convite.input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar permissão"
            aria-label="Procurar permissão"
            className={campoNu}
          />
          {busca && (
            <button data-gc="configuracoes.aplicativos.construtor-de-convite.button--3"
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar a busca"
              className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
            >
              <X data-gc="configuracoes.aplicativos.construtor-de-convite.x" size={14} />
            </button>
          )}
        </div>

        <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--5" className="mt-3 max-h-72 space-y-4 overflow-y-auto pr-1">
          {grupos.map((grupo) => (
            <section data-gc="configuracoes.aplicativos.construtor-de-convite.section" key={grupo.label}>
              <p data-gc="configuracoes.aplicativos.construtor-de-convite.p--2" className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                {grupo.label}
              </p>

              <div data-gc="configuracoes.aplicativos.construtor-de-convite.div--6" className="grid gap-1 sm:grid-cols-2">
                {grupo.permissions.map((permissao) => {
                  const marcada = escolhidas.includes(permissao);
                  const pesada = permissao === "ADMINISTRATOR";

                  return (
                    <button data-gc="configuracoes.aplicativos.construtor-de-convite.button--4"
                      key={permissao}
                      type="button"
                      onClick={() => alternar(permissao)}
                      title={PERMISSION_LABELS[permissao]?.descricao}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1.5 text-left text-sm transition",
                        marcada ? "bg-surface-3 text-ink" : "text-ink-muted hover:bg-surface-3/60",
                      )}
                    >
                      <span data-gc="configuracoes.aplicativos.construtor-de-convite.span"
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border transition",
                          marcada
                            ? pesada
                              ? "border-danger bg-danger text-white"
                              : "border-brand bg-brand text-white"
                            : "border-ink-faint",
                        )}
                      >
                        {marcada && <Check data-gc="configuracoes.aplicativos.construtor-de-convite.check" size={11} strokeWidth={3} />}
                      </span>

                      <span data-gc="configuracoes.aplicativos.construtor-de-convite.span--2" className={cn("min-w-0 truncate", pesada && marcada && "text-danger")}>
                        {PERMISSION_LABELS[permissao]?.nome ?? permissao}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {!grupos.length && (
            <p data-gc="configuracoes.aplicativos.construtor-de-convite.p--3" className="py-6 text-center text-sm text-ink-faint">
              Nenhuma permissão com esse nome.
            </p>
          )}
        </div>

        {escolhidas.includes("ADMINISTRATOR") && (
          <p data-gc="configuracoes.aplicativos.construtor-de-convite.p--4" className="mt-3 rounded border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-ink-muted">
            Com <strong data-gc="configuracoes.aplicativos.construtor-de-convite.strong" className="text-danger">Administrador</strong>, o bot pode tudo —
            inclusive apagar canais e banir gente. Só marque se você escreveu o código dele.
          </p>
        )}
      </div>
    </>
  );
};
