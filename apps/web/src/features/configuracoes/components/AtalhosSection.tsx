import React, { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Search, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import { bareField, fieldGroup } from "~/components/ui/input";
import { ConfigSection as Section } from "~/features/configuracoes/components/SecaoDeConfig";
import {
  AREAS,
  SHORTCUTS,
  type Shortcut,
  type Combo,
  match,
  eventCombo,
  writeCombo,
} from "~/features/configuracoes/lib/atalhos";
import { useShortcuts } from "~/features/configuracoes/stores/atalhos";
import { useSettings } from "~/features/configuracoes/stores/configuracoes";
import { cn } from "~/lib/utils";

export const ShortcutsSection: React.FC = () => {
  const swapped = useShortcuts((s) => s.swapped);
  const off = useShortcuts((s) => s.off);
  const restoreEverything = useShortcuts((s) => s.restoreEverything);
  const open = useSettings((s) => s.open);

  const [search, setSearch] = useState("");
  const [capturing, setCapturing] = useState<string | null>(null);

  const term = search.toLowerCase().trim();

  const touched = Object.keys(swapped).length > 0 || off.length > 0;

  const byArea = useMemo(
    () =>
      AREAS.map((area) => ({
        ...area,
        shortcuts: SHORTCUTS.filter(
          (shortcut) =>
            shortcut.area === area.id &&
            (!term ||
              shortcut.name.toLowerCase().includes(term) ||
              shortcut.detail.toLowerCase().includes(term) ||
              writeCombo(swapped[shortcut.id] ?? shortcut.fallback)
                .toLowerCase()
                .includes(term)),
        ),
      })),
    [term, swapped],
  );

  return (
    <div data-gc="configuracoes.atalhos-section.div" className="max-w-2xl pb-10">
      <p data-gc="configuracoes.atalhos-section.p" className="text-sm text-ink-muted">
        Os atalhos que o Gravaê entende hoje. Os que têm tecla trocável valem em
        qualquer lugar do app; os fixos são do próprio campo de texto e não dá
        pra mexer.
      </p>

      <div data-gc="configuracoes.atalhos-section.div--2" className={cn(fieldGroup, "mt-5")}>
        <Search data-gc="configuracoes.atalhos-section.search" size={14} className="shrink-0 text-ink-faint" />
        <input data-gc="configuracoes.atalhos-section.input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Procurar atalho"
          aria-label="Procurar atalho"
          className={bareField}
        />
        {search && (
          <button data-gc="configuracoes.atalhos-section.button"
            type="button"
            onClick={() => setSearch("")}
            aria-label="Limpar a busca"
            className="shrink-0 rounded p-0.5 text-ink-faint transition hover:text-ink"
          >
            <X data-gc="configuracoes.atalhos-section.x" size={14} />
          </button>
        )}
      </div>

      {byArea.map((area) =>
        area.shortcuts.length ? (
          <Section data-gc="configuracoes.atalhos-section.section"
            key={area.id}
            id={`atalhos-${area.id}`}
            title={area.name}
            detail={area.detail}
          >
            <div data-gc="configuracoes.atalhos-section.div--3" className="overflow-hidden rounded-lg border border-line">
              {area.shortcuts.map((shortcut) => (
                <ShortcutLine data-gc="configuracoes.atalhos-section.shortcut-line"
                  key={shortcut.id}
                  shortcut={shortcut}
                  combo={swapped[shortcut.id] ?? shortcut.fallback}
                  swapped={Boolean(swapped[shortcut.id])}
                  on={!off.includes(shortcut.id)}
                  capturing={capturing === shortcut.id}
                  onCapture={() => setCapturing(shortcut.id)}
                  onGiveup={() => setCapturing(null)}
                />
              ))}
            </div>

            {area.id === "voice" && (
              <Button data-gc="configuracoes.atalhos-section.button--2"
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => open("voice", "modo-de-entrada")}
              >
                Ir para o push-to-talk
              </Button>
            )}
          </Section>
        ) : null,
      )}

      {!byArea.some((area) => area.shortcuts.length) && (
        <p data-gc="configuracoes.atalhos-section.p--2" className="mt-6 text-sm text-ink-faint">Nenhum atalho com esse nome.</p>
      )}

      <Section data-gc="configuracoes.atalhos-section.section--2"
        id="voltar-ao-padrao"
        title="Voltar ao padrão"
        detail="Devolve todas as teclas de fábrica e religa o que você desligou."
      >
        <div data-gc="configuracoes.atalhos-section.div--4" className="flex items-start gap-4">
          <div data-gc="configuracoes.atalhos-section.div--5" className="min-w-0 flex-1">
            <p data-gc="configuracoes.atalhos-section.p--3" className="text-sm font-medium">Restaurar todos os atalhos</p>
            <p data-gc="configuracoes.atalhos-section.p--4" className="mt-0.5 text-xs text-ink-faint">
              {touched
                ? "Você mexeu em pelo menos um atalho."
                : "Está tudo como veio de fábrica."}
            </p>
          </div>

          <Button data-gc="configuracoes.atalhos-section.button.restore-everything" variant="surface" disabled={!touched} onClick={restoreEverything}>
            <RotateCcw data-gc="configuracoes.atalhos-section.rotate-ccw" size={16} /> Restaurar
          </Button>
        </div>
      </Section>
    </div>
  );
};

const ShortcutLine: React.FC<{
  shortcut: Shortcut;
  combo: Combo;
  swapped: boolean;
  on: boolean;
  capturing: boolean;
  onCapture: () => void;
  onGiveup: () => void;
}> = ({ shortcut, combo, swapped, on, capturing, onCapture, onGiveup }) => {
  const swap = useShortcuts((s) => s.swap);
  const defaultGive = useShortcuts((s) => s.defaultGive);
  const toggle = useShortcuts((s) => s.toggle);

  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!capturing) return;

    button.current?.focus();

    const onType = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === "Escape") return onGiveup();

      const fresh = eventCombo(event);
      if (!fresh) return;

      const conflict = SHORTCUTS.find(
        (other) => other.id !== shortcut.id && match(other.fallback, fresh),
      );

      if (conflict) return;

      swap(shortcut.id, fresh);
      onGiveup();
    };

    window.addEventListener("keydown", onType, { capture: true });
    return () => window.removeEventListener("keydown", onType, { capture: true });
  }, [capturing, shortcut.id, swap, onGiveup]);

  return (
    <div data-gc="configuracoes.atalhos-section.div--6" className="flex items-center gap-3 border-b border-divisor px-3 py-2.5 last:border-b-0">
      <div data-gc="configuracoes.atalhos-section.div--7" className="min-w-0 flex-1">
        <p data-gc="configuracoes.atalhos-section.p--5" className={cn("text-sm font-medium", !on && "text-ink-faint")}>
          {shortcut.name}
        </p>
        <p data-gc="configuracoes.atalhos-section.p--6" className="mt-0.5 text-xs text-ink-faint">{shortcut.detail}</p>
      </div>

      {shortcut.fixed ? (
        <kbd data-gc="configuracoes.atalhos-section.kbd" className="shrink-0 rounded border border-line bg-surface-0 px-2 py-1 font-mono text-xs text-ink-muted">
          {writeCombo(combo)}
        </kbd>
      ) : (
        <>
          {swapped && (
            <button data-gc="configuracoes.atalhos-section.button--3"
              type="button"
              onClick={() => defaultGive(shortcut.id)}
              aria-label={`Voltar ${shortcut.name} ao padrão`}
              title={`Padrão: ${writeCombo(shortcut.fallback)}`}
              className="shrink-0 rounded p-1 text-ink-faint transition hover:text-ink"
            >
              <RotateCcw data-gc="configuracoes.atalhos-section.rotate-ccw--2" size={14} />
            </button>
          )}

          <button data-gc="configuracoes.atalhos-section.button.on-giveup"
            ref={button}
            type="button"
            onClick={capturing ? onGiveup : onCapture}
            onBlur={onGiveup}
            disabled={!on}
            className={cn(
              "shrink-0 rounded border px-2 py-1 font-mono text-xs transition",
              capturing
                ? "border-brand bg-brand/10 text-ink"
                : "border-line bg-surface-0 text-ink-muted hover:border-ink-faint hover:text-ink",
              !on && "opacity-40",
            )}
          >
            {capturing ? "Aperte a tecla…" : writeCombo(combo)}
          </button>

          <Switch data-gc="configuracoes.atalhos-section.switch"
            checked={on}
            onCheckedChange={(value) => toggle(shortcut.id, value)}
            aria-label={`Ligar ou desligar ${shortcut.name}`}
          />
        </>
      )}
    </div>
  );
};
