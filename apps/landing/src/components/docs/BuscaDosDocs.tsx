"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { search, type Found } from "~/dados/indice-da-busca";

const KIND_COLOR: Record<Found["kind"], string> = {
  Página: "bg-brand/15 text-brand",
  Rota: "bg-online/15 text-online",
  Evento: "bg-amber-400/15 text-amber-400",
  Permissão: "bg-sky-400/15 text-sky-400",
  Limite: "bg-surface-4 text-ink-muted",
};

export const DocsSearch = ({ compact = false }: { compact?: boolean }) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState(0);
  const field = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => search(term), [term]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setIsOpen(true);
      }

      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, []);

  useEffect(() => {
    if (isOpen) field.current?.focus();
    else {
      setTerm("");
      setPicked(0);
    }
  }, [isOpen]);

  useEffect(() => setPicked(0), [term]);

  const ir = (match: Found) => {
    setIsOpen(false);
    router.push(match.href);
  };

  const inKey = (event: React.KeyboardEvent) => {
    if (!matches.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setPicked((before) => (before + 1) % matches.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setPicked((before) => (before - 1 + matches.length) % matches.length);
    }

    if (event.key === "Enter") {
      event.preventDefault();
      ir(matches[picked]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Buscar na documentação"
        className={
          compact
            ? "rounded-md p-2 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            : "flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-1 px-3.5 py-2 text-sm text-ink-faint transition hover:border-surface-4"
        }
      >
        <Search className={compact ? "size-5" : "size-4"} />

        {compact ? null : (
          <>
            Buscar
            <kbd className="ml-auto rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] text-ink-faint">
              ⌘K
            </kbd>
          </>
        )}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Fechar a busca"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface-1 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-ink-faint" />

              <input
                ref={field}
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onKeyDown={inKey}
                placeholder="Rota, evento, permissão, página…"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-ink-faint"
              />

              <kbd className="shrink-0 rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-faint">
                esc
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {term && !matches.length ? (
                <p className="px-3 py-8 text-center text-sm text-ink-faint">
                  Nada com “{term}”.
                </p>
              ) : null}

              {!term ? (
                <p className="px-3 py-8 text-center text-sm text-ink-faint">
                  Busque por qualquer coisa da referência — <code>message:send</code>,{" "}
                  <code>SHARE_SCREEN</code>, <code>/bot/eu</code>.
                </p>
              ) : null}

              {matches.map((match, index) => (
                <button
                  key={`${match.kind}-${match.title}-${match.href}`}
                  type="button"
                  onClick={() => ir(match)}
                  onMouseEnter={() => setPicked(index)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    index === picked ? "bg-surface-3" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{match.title}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {match.context}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${KIND_COLOR[match.kind]}`}
                  >
                    {match.kind}
                  </span>

                  {index === picked ? (
                    <CornerDownLeft className="size-3.5 shrink-0 text-ink-faint" />
                  ) : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
