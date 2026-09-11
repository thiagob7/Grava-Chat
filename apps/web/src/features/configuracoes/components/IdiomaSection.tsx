import React, { useMemo, useState } from "react";
import {
  radioOptionClass,
  radioGroupClass,
  RadioIndicator,
} from "~/components/ui/radio-group";

import { SelectField } from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { LANGUAGES, currentLanguage, swapLanguage, useTranslation } from "~/traducao";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";

export const LanguageSection: React.FC = () => {
  const prefs = useAppearance();
  const { t } = useTranslation();

  const examples = useMemo(() => {
    const now = new Date();

    return {
      "idioma.formatoDaHora.vinteQuatro": now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      "idioma.formatoDaHora.dozeHoras": now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    } as Record<string, string>;
  }, []);

  const FORMATS = FORMATS_BASE.map((format) => ({
    ...format,
    example: examples[format.key] ?? "",
  }));

  return (
    <div data-gc="configuracoes.idioma-section.div">
      <p data-gc="configuracoes.idioma-section.p" className="text-sm text-ink-muted">
        Vale para este aparelho — nada aqui viaja com a conta.
      </p>

      <Section data-gc="configuracoes.idioma-section.section"
        id="idioma-da-interface"
        title={t("idioma.titulo")}
        detail={t("idioma.detalhe")}
      >
        <PickLanguage data-gc="configuracoes.idioma-section.pick-language" />
      </Section>

      <Section data-gc="configuracoes.idioma-section.section--2"
        id="formato-da-hora"
        title={t("idioma.formatoDaHora.titulo")}
        detail={t("idioma.formatoDaHora.detalhe")}
      >
        <div data-gc="configuracoes.idioma-section.div--2"
          role="radiogroup"
          aria-label={t("idioma.formatoDaHora.titulo")}
          className={cn(radioGroupClass(), "space-y-2")}
        >
          {FORMATS.map((format) => {
            const picked = prefs.hourIn24h === format.twentyFour;

            return (
              <button data-gc="configuracoes.idioma-section.button"
                key={format.key}
                type="button"
                role="radio"
                data-state={picked ? "checked" : "unchecked"}
                aria-checked={picked}
                onClick={() =>
                  prefs.set({ hourIn24h: format.twentyFour })
                }
                className={cn(
                  radioOptionClass(),
                  "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition",
                  picked
                    ? "border-brand bg-brand/5"
                    : "border-line hover:bg-surface-3",
                )}
              >
                <RadioIndicator data-gc="configuracoes.idioma-section.radio-indicator" selected={picked} className="mt-0.5" />

                <span data-gc="configuracoes.idioma-section.span" className="min-w-0 flex-1">
                  <span data-gc="configuracoes.idioma-section.span--2" className="block text-sm font-medium">
                    {t(format.key)}
                  </span>
                  <span data-gc="configuracoes.idioma-section.span--3" className="mt-0.5 block font-mono text-xs text-ink-faint">
                    {format.example}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
};

const FORMATS_BASE = [
  { key: "idioma.formatoDaHora.vinteQuatro", twentyFour: true },
  { key: "idioma.formatoDaHora.dozeHoras", twentyFour: false },
] as const;

const PickLanguage: React.FC = () => {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(currentLanguage);

  return (
    <div data-gc="configuracoes.idioma-section.div--3">
      <p data-gc="configuracoes.idioma-section.p--2" className="mb-3 rounded-lg border border-line bg-surface-2 p-3 text-xs text-ink-muted">
        {t("idioma.emAndamento")}
      </p>

      <SelectField data-gc="configuracoes.idioma-section.select-field"
        value={current}
        onSelect={(lng) => {
          setCurrent(lng);
          void swapLanguage(lng);
        }}
        options={LANGUAGES.map((language) => ({
          value: language.lng,
          label: (
            <span data-gc="configuracoes.idioma-section.span--4" className="flex w-full min-w-0 items-center gap-3">
              <span data-gc="configuracoes.idioma-section.span--5" className="min-w-0 flex-1 truncate">{language.native}</span>
              <span data-gc="configuracoes.idioma-section.span--6" className="shrink-0 text-ink-faint">{language.name}</span>
              <span data-gc="configuracoes.idioma-section.span--7" aria-hidden className="shrink-0 text-base leading-none">
                {language.flag}
              </span>
            </span>
          ),
        }))}
      />
    </div>
  );
};
