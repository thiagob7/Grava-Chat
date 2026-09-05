import React, { useMemo, useState } from "react";
import { Check, Code2 } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Tooltip } from "~/components/ui/tooltip";
import { IDIOMAS } from "~/features/conversa/lib/realce";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface SeletorDeIdiomaProps {
  idioma: string;
  onEscolher: (idioma: string) => void;
  className?: string;
}

export const SeletorDeIdioma: React.FC<SeletorDeIdiomaProps> = ({
  idioma,
  onEscolher,
  className,
}) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();

  const filtrados = useMemo(
    () =>
      IDIOMAS.filter(
        (item) =>
          !termo ||
          item.rotulo.includes(termo) ||
          (item.formato ?? "").toLowerCase().includes(termo),
      ),
    [termo],
  );

  return (
    <Popover
      open={aberto}
      onOpenChange={(estado) => {
        setAberto(estado);
        if (!estado) setBusca("");
      }}
    >
      <Tooltip label={t("conversa.codigo.mudarIdioma")}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("conversa.codigo.mudarIdioma")}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-hover hover:text-ink",
              aberto && "bg-hover text-ink",
              className,
            )}
          >
            <Code2 size={16} />
          </button>
        </PopoverTrigger>
      </Tooltip>

      <PopoverContent align="end" className="w-56 p-0">
        <div className="p-2">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={t("conversa.codigo.procurarIdioma")}
            aria-label={t("conversa.codigo.procurarIdioma")}
            autoFocus
            className="w-full rounded border border-line bg-campo px-2 py-1.5 text-13 text-ink outline-none placeholder:text-ink-faint focus-visible:border-campo-foco"
          />
        </div>

        <div className="max-h-64 overflow-y-auto pb-1">
          {filtrados.map((item) => {
            const escolhido = item.id === idioma;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onEscolher(item.id);
                  setAberto(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-13 transition",
                  escolhido
                    ? "bg-brand text-white"
                    : "text-ink-muted hover:bg-hover hover:text-ink",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{item.rotulo}</span>

                {item.formato && (
                  <span
                    className={cn(
                      "shrink-0 text-10 uppercase tracking-wide",
                      escolhido ? "text-white/70" : "text-ink-faint",
                    )}
                  >
                    {item.formato}
                  </span>
                )}

                {escolhido && <Check size={14} className="shrink-0" />}
              </button>
            );
          })}

          {!filtrados.length && (
            <p className="px-3 py-4 text-center text-13 text-ink-faint">
              {t("conversa.codigo.nenhumIdioma")}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
