import React from "react";

import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { Slider } from "~/components/ui/slider";
import { Choice } from "~/features/configuracoes/components/campos-de-config";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import { useTranslation } from "~/traducao";

const Range: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step = 1, onChange }) => (
  <label data-gc="configuracoes.secao-de-efeitos.label" className="block">
    <span data-gc="configuracoes.secao-de-efeitos.span" className="flex items-baseline justify-between text-sm">
      <span data-gc="configuracoes.secao-de-efeitos.span--2" className="font-medium">{label}</span>
      <span data-gc="configuracoes.secao-de-efeitos.span--3" className="tabular-nums text-xs text-ink-faint">{value}</span>
    </span>

    <Slider data-gc="configuracoes.secao-de-efeitos.slider"
      className="mt-2"
      min={min}
      max={max}
      step={step}
      value={value}
      filled={(value - min) / (max - min)}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </label>
);

const ColorField: React.FC<{
  label: string;
  value: string;
  onChange: (color: string) => void;
}> = ({ label, value, onChange }) => (
  <label data-gc="configuracoes.secao-de-efeitos.label--2" className="flex items-center justify-between gap-3 text-sm">
    <span data-gc="configuracoes.secao-de-efeitos.span--4" className="font-medium">{label}</span>

    <span data-gc="configuracoes.secao-de-efeitos.span--5" className="flex items-center gap-2">
      <span data-gc="configuracoes.secao-de-efeitos.span--6" className="font-mono text-xs uppercase text-ink-faint">{value}</span>

      <input data-gc="configuracoes.secao-de-efeitos.input"
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="size-8 shrink-0 cursor-pointer rounded-lg border border-line bg-transparent p-0.5"
      />
    </span>
  </label>
);

export const EffectsSection: React.FC = () => {
  const { t } = useTranslation();
  const prefs = useAppearance();

  return (
    <Section data-gc="configuracoes.secao-de-efeitos.section"
      id="efeitos-do-ponteiro"
      title={t("configuracoes.efeitos.titulo")}
      detail={t("configuracoes.efeitos.detalhe")}
    >
      <Choice data-gc="configuracoes.secao-de-efeitos.choice"
        title={t("configuracoes.efeitos.rastro")}
        detail={t("configuracoes.efeitos.rastroDetalhe")}
        on={prefs.cursorTrail}
        onChange={(cursorTrail) => prefs.set({ cursorTrail })}
      />

      {prefs.cursorTrail && (
        <div data-gc="configuracoes.secao-de-efeitos.div" className="mt-3 space-y-4 rounded-lg border border-line bg-surface-1 p-4">
          <ColorField data-gc="configuracoes.secao-de-efeitos.color-field"
            label={t("configuracoes.efeitos.cor")}
            value={prefs.trailColor}
            onChange={(trailColor) => prefs.set({ trailColor })}
          />

          <Range data-gc="configuracoes.secao-de-efeitos.range--2"
            label={t("configuracoes.efeitos.espessura")}
            value={prefs.trailSize}
            min={2}
            max={24}
            onChange={(trailSize) => prefs.set({ trailSize })}
          />

          <Range data-gc="configuracoes.secao-de-efeitos.range--3"
            label={t("configuracoes.efeitos.comprimento")}
            value={prefs.trailWisp}
            min={6}
            max={60}
            onChange={(trailWisp) => prefs.set({ trailWisp })}
          />
        </div>
      )}

      <div data-gc="configuracoes.secao-de-efeitos.div--2" className="mt-5">
        <Choice data-gc="configuracoes.secao-de-efeitos.choice--2"
          title={t("configuracoes.efeitos.faisca")}
          detail={t("configuracoes.efeitos.faiscaDetalhe")}
          on={prefs.clickSpark}
          onChange={(clickSpark) => prefs.set({ clickSpark })}
        />
      </div>

      {prefs.clickSpark && (
        <div data-gc="configuracoes.secao-de-efeitos.div--3" className="mt-3 space-y-4 rounded-lg border border-line bg-surface-1 p-4">
          <ColorField data-gc="configuracoes.secao-de-efeitos.color-field--2"
            label={t("configuracoes.efeitos.cor")}
            value={prefs.sparkColor}
            onChange={(sparkColor) => prefs.set({ sparkColor })}
          />

          <Range data-gc="configuracoes.secao-de-efeitos.range--4"
            label={t("configuracoes.efeitos.tamanho")}
            value={prefs.sparkSize}
            min={4}
            max={30}
            onChange={(sparkSize) => prefs.set({ sparkSize })}
          />

          <Range data-gc="configuracoes.secao-de-efeitos.range--5"
            label={t("configuracoes.efeitos.quantidade")}
            value={prefs.countSparks}
            min={3}
            max={16}
            onChange={(countSparks) => prefs.set({ countSparks })}
          />
        </div>
      )}
    </Section>
  );
};
