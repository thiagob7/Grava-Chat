import React, { useMemo, useState } from "react";
import { Check, Code2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { LANGUAGES } from "~/features/conversa/lib/realce";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface LanguagePropsPicker {
  language: string;
  onPick: (language: string) => void;
  className?: string;
}

export const LanguagePicker: React.FC<LanguagePropsPicker> = ({
  language,
  onPick,
  className,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      LANGUAGES.filter(
        (item) =>
          !term ||
          item.label.includes(term) ||
          (item.format ?? "").toLowerCase().includes(term),
      ),
    [term],
  );

  return (
    <Popover data-gc="conversa.seletor-de-idioma.popover"
      open={isOpen}
      onOpenChange={(state) => {
        setIsOpen(state);
        if (!state) setSearch("");
      }}
    >
      <Tooltip data-gc="conversa.seletor-de-idioma.tooltip" label={t("conversa.codigo.mudarIdioma")}>
        <PopoverTrigger data-gc="conversa.seletor-de-idioma.popover-trigger" asChild>
          <button data-gc="conversa.seletor-de-idioma.button"
            type="button"
            aria-label={t("conversa.codigo.mudarIdioma")}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-hover hover:text-ink",
              isOpen && "bg-hover text-ink",
              className,
            )}
          >
            <Code2 data-gc="conversa.seletor-de-idioma.code2" size={16} />
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent data-gc="conversa.seletor-de-idioma.popover-content" align="end" className="w-56 p-0">
        <div data-gc="conversa.seletor-de-idioma.div" className="p-2">
          <input data-gc="conversa.seletor-de-idioma.input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("conversa.codigo.procurarIdioma")}
            aria-label={t("conversa.codigo.procurarIdioma")}
            autoFocus
            className="w-full rounded border border-line bg-campo px-2 py-1.5 text-13 text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
          />
        </div>

        <div data-gc="conversa.seletor-de-idioma.div--2" className="max-h-64 overflow-y-auto pb-1">
          {filtered.map((item) => {
            const picked = item.id === language;

            return (
              <button data-gc="conversa.seletor-de-idioma.button--2"
                key={item.id}
                type="button"
                onClick={() => {
                  onPick(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-13 transition",
                  picked
                    ? "bg-brand text-sobre-marca"
                    : "text-ink-muted hover:bg-hover hover:text-ink",
                )}
              >
                <span data-gc="conversa.seletor-de-idioma.span" className="min-w-0 flex-1 truncate">{item.label}</span>

                {item.format && (
                  <span data-gc="conversa.seletor-de-idioma.span--2"
                    className={cn(
                      "shrink-0 text-10 uppercase tracking-wide",
                      picked ? "text-sobre-marca/70" : "text-ink-faint",
                    )}
                  >
                    {item.format}
                  </span>
                )}

                {picked && <Check data-gc="conversa.seletor-de-idioma.check" size={14} className="shrink-0" />}
              </button>
            );
          })}

          {!filtered.length && (
            <p data-gc="conversa.seletor-de-idioma.p" className="px-3 py-4 text-center text-13 text-ink-faint">
              {t("conversa.codigo.nenhumIdioma")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
