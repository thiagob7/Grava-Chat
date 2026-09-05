import React, { useMemo, useState } from "react";

import { CampoSelect } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { IDIOMAS, idiomaAtual, trocarIdioma, useTranslation } from "~/traducao";
import { SecaoDeConfig as Secao } from "~/features/configuracoes/components/SecaoDeConfig";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";

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
    <div data-gc="configuracoes.idioma-section.div">
      <p data-gc="configuracoes.idioma-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Secao data-gc="configuracoes.idioma-section.secao"
        id="idioma-da-interface"
        titulo={t("idioma.titulo")}
        detalhe={t("idioma.detalhe")}
      >
        <EscolherIdioma data-gc="configuracoes.idioma-section.escolher-idioma" />
      </Secao>

      <Secao data-gc="configuracoes.idioma-section.secao--2"
        id="formato-da-hora"
        titulo={t("idioma.formatoDaHora.titulo")}
        detalhe={t("idioma.formatoDaHora.detalhe")}
      >
        <div data-gc="configuracoes.idioma-section.div--2"
          role="radiogroup"
          aria-label={t("idioma.formatoDaHora.titulo")}
          className="space-y-2"
        >
          {FORMATOS.map((formato) => {
            const escolhido = prefs.horaEm24h === formato.vinteQuatro;

            return (
              <button data-gc="configuracoes.idioma-section.button"
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
                <span data-gc="configuracoes.idioma-section.span"
                  aria-hidden
                  className={cn(
                    "relative mt-0.5 size-4 shrink-0 rounded-full border transition",
                    escolhido ? "border-brand" : "border-surface-4",
                  )}
                >
                  {escolhido && (
                    <span data-gc="configuracoes.idioma-section.span--2" className="absolute inset-[3px] rounded-full bg-brand" />
                  )}
                </span>

                <span data-gc="configuracoes.idioma-section.span--3" className="min-w-0 flex-1">
                  <span data-gc="configuracoes.idioma-section.span--4" className="block text-sm font-medium">
                    {t(formato.chave)}
                  </span>
                  <span data-gc="configuracoes.idioma-section.span--5" className="mt-0.5 block font-mono text-xs text-ink-faint">
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
    <div data-gc="configuracoes.idioma-section.div--3">
      <p data-gc="configuracoes.idioma-section.p--2" className="mb-3 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
        {t("idioma.emAndamento")}
      </p>

      <CampoSelect data-gc="configuracoes.idioma-section.campo-select"
        valor={atual}
        onEscolher={(lng) => {
          setAtual(lng);
          void trocarIdioma(lng);
        }}
        opcoes={IDIOMAS.map((idioma) => ({
          valor: idioma.lng,
          rotulo: (
            <span data-gc="configuracoes.idioma-section.span--6" className="flex w-full min-w-0 items-center gap-3">
              <span data-gc="configuracoes.idioma-section.span--7" className="min-w-0 flex-1 truncate">{idioma.nativo}</span>
              <span data-gc="configuracoes.idioma-section.span--8" className="shrink-0 text-ink-faint">{idioma.nome}</span>
              <span data-gc="configuracoes.idioma-section.span--9" aria-hidden className="shrink-0 text-base leading-none">
                {idioma.bandeira}
              </span>
            </span>
          ),
        }))}
      />
    </div>
  );
};
