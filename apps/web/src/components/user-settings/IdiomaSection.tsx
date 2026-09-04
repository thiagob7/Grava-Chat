import React, { useMemo, useState } from "react";

import { CampoSelect } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { IDIOMAS, idiomaAtual, trocarIdioma, useTranslation } from "~/traducao";
import { SecaoDeConfig as Secao } from "~/components/user-settings/SecaoDeConfig";
import { useAparencia } from "~/stores/aparencia";

export const IdiomaSection: React.FC = () => {
  const prefs = useAparencia();
  const { t } = useTranslation();

  const exemplos = useMemo(() => {
    const agora = new Date();

    return {
      "idioma.formatoDaHora.vinteQuatro": agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      "idioma.formatoDaHora.dozeHoras": agora.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    } as Record<string, string>;
  }, []);

  const FORMATOS = FORMATOS_BASE.map((formato) => ({
    ...formato,
    exemplo: exemplos[formato.chave] ?? "",
  }));

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao
        id="idioma-da-interface"
        titulo={t("idioma.titulo")}
        detalhe={t("idioma.detalhe")}
      >
        <EscolherIdioma />
      </Secao>

      <Secao
        id="formato-da-hora"
        titulo={t("idioma.formatoDaHora.titulo")}
        detalhe={t("idioma.formatoDaHora.detalhe")}
      >
        <div
          role="radiogroup"
          aria-label={t("idioma.formatoDaHora.titulo")}
          className="space-y-2"
        >
          {FORMATOS.map((formato) => {
            const escolhido = prefs.horaEm24h === formato.vinteQuatro;

            return (
              <button
                key={formato.chave}
                type="button"
                role="radio"
                aria-checked={escolhido}
                onClick={() =>
                  prefs.definir({ horaEm24h: formato.vinteQuatro })
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                  escolhido
                    ? "border-brand bg-brand/5"
                    : "border-line hover:bg-surface-3",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "relative mt-0.5 size-4 shrink-0 rounded-full border transition",
                    escolhido ? "border-brand" : "border-surface-4",
                  )}
                >
                  {escolhido && (
                    <span className="absolute inset-[3px] rounded-full bg-brand" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {t(formato.chave)}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-ink-faint">
                    {formato.exemplo}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Secao>
    </div>
  );
};

const FORMATOS_BASE = [
  { chave: "idioma.formatoDaHora.vinteQuatro", vinteQuatro: true },
  { chave: "idioma.formatoDaHora.dozeHoras", vinteQuatro: false },
] as const;

const EscolherIdioma: React.FC = () => {
  const { t } = useTranslation();
  const [atual, setAtual] = useState(idiomaAtual);

  return (
    <div>
      <p className="mb-3 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
        {t("idioma.emAndamento")}
      </p>

      <CampoSelect
        valor={atual}
        onEscolher={(lng) => {
          setAtual(lng);
          void trocarIdioma(lng);
        }}
        opcoes={IDIOMAS.map((idioma) => ({
          valor: idioma.lng,
          rotulo: (
            <span className="flex w-full min-w-0 items-center gap-3">
              <span className="min-w-0 flex-1 truncate">{idioma.nativo}</span>
              <span className="shrink-0 text-ink-faint">{idioma.nome}</span>
              <span aria-hidden className="shrink-0 text-base leading-none">
                {idioma.bandeira}
              </span>
            </span>
          ),
        }))}
      />
    </div>
  );
};
