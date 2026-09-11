import React, { useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";

import { Switch } from "~/components/ui/switch";
import { bareField, fieldGroup } from "~/components/ui/input";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import {
  SETTINGS,
  CATEGORIES,
  type Setting,
  shortcutsSettings,
} from "~/features/configuracoes/lib/ajustes";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useShortcuts } from "~/features/configuracoes/stores/atalhos";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { useNotices } from "~/stores/notificacoes";
import { cn } from "~/lib/utils";

export const AdvancedSection: React.FC = () => {
  const open = useSettings((s) => s.open);

  useAppearance();
  useNotices();
  useShortcuts();

  const [search, setSearch] = useState("");

  const term = search.toLowerCase().trim();

  const all = [...SETTINGS, ...shortcutsSettings()];

  const byCategory = CATEGORIES.map((category) => ({
    ...category,
    settings: all.filter(
      (setting) =>
        setting.category === category.id &&
        (!term ||
          setting.label.toLowerCase().includes(term) ||
          setting.detail.toLowerCase().includes(term)),
    ),
  })).filter((category) => category.settings.length);

  return (
    <div data-gc="configuracoes.avancado-section.div" className="max-w-2xl pb-10">
      <p data-gc="configuracoes.avancado-section.p" className="text-sm text-ink-muted">
        Tudo que está espalhado pelas outras telas, numa lista só. Os
        interruptores valem daqui mesmo; o resto leva você até onde ele mora.
      </p>

      <div data-gc="configuracoes.avancado-section.div--2" className={cn(fieldGroup, "mt-5")}>
        <Search data-gc="configuracoes.avancado-section.search" size={14} className="shrink-0 text-ink-faint" />
        <input data-gc="configuracoes.avancado-section.input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar em todas as configurações"
          aria-label="Procurar configuração"
          className={bareField}
        />
        {search && (
          <button data-gc="configuracoes.avancado-section.button"
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpar a busca"
            className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
          >
            <X data-gc="configuracoes.avancado-section.x" size={14} />
          </button>
        )}
      </div>

      {byCategory.map((category) => (
        <Section data-gc="configuracoes.avancado-section.section" key={category.id} id={`avancado-${category.id}`} title={category.name}>
          <div data-gc="configuracoes.avancado-section.div--3" className="overflow-hidden rounded-lg border border-line">
            {category.settings.map((setting) => (
              <SettingLine data-gc="configuracoes.avancado-section.setting-line"
                key={setting.id}
                setting={setting}
                onIr={() => open(setting.display, setting.sub)}
              />
            ))}
          </div>
        </Section>
      ))}

      {!byCategory.length && (
        <p data-gc="configuracoes.avancado-section.p--2" className="mt-6 text-sm text-ink-faint">Nenhuma configuração com esse nome.</p>
      )}
    </div>
  );
};

const SettingLine: React.FC<{ setting: Setting; onIr: () => void }> = ({ setting, onIr }) => (
  <div data-gc="configuracoes.avancado-section.div--4" className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0">
    <div data-gc="configuracoes.avancado-section.div--5" className="min-w-0 flex-1">
      <p data-gc="configuracoes.avancado-section.p--3" className="text-sm font-medium">{setting.label}</p>
      <p data-gc="configuracoes.avancado-section.p--4" className="mt-0.5 text-xs text-ink-faint">{setting.detail}</p>
    </div>

    {setting.kind === "interruptor" ? (
      <>
        <button data-gc="configuracoes.avancado-section.button.on-ir"
          type="button"
          onClick={onIr}
          aria-label={`Ir para ${setting.label}`}
          title="Ir para onde este ajuste mora"
          className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-surface-3 hover:text-ink"
        >
          <ChevronRight data-gc="configuracoes.avancado-section.chevron-right" size={16} />
        </button>

        <Switch data-gc="configuracoes.avancado-section.switch.write"
          checked={setting.read()}
          onCheckedChange={setting.write}
          aria-label={setting.label}
        />
      </>
    ) : (
      <button data-gc="configuracoes.avancado-section.button.on-ir--2"
        type="button"
        onClick={onIr}
        className="flex shrink-0 items-center gap-1 rounded px-1.5 py-1 text-xs text-ink-muted transition hover:bg-surface-3 hover:text-ink"
      >
        {setting.read()}
        <ChevronRight data-gc="configuracoes.avancado-section.chevron-right--2" size={14} className="text-ink-faint" />
      </button>
    )}
  </div>
);
