"use client";

import { CornerDownLeft, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { buscar, type Achado } from "~/dados/indice-da-busca";

const COR_DO_TIPO: Record<Achado["tipo"], string> = {
  Página: "bg-brand/15 text-brand",
  Rota: "bg-online/15 text-online",
  Evento: "bg-amber-400/15 text-amber-400",
  Permissão: "bg-sky-400/15 text-sky-400",
  Limite: "bg-surface-4 text-ink-muted",
};

export const BuscaDosDocs = ({ compacta = false }: { compacta?: boolean }) => {
  const router = useRouter();
  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [escolhido, setEscolhido] = useState(0);
  const campo = useRef<HTMLInputElement>(null);

  const achados = useMemo(() => buscar(termo), [termo]);

  useEffect(() => {
    const atalho = (evento: KeyboardEvent) => {
      if (evento.key === "k" && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault();
        setAberta(true);
      }

      if (evento.key === "Escape") setAberta(false);
    };

    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  useEffect(() => {
    if (aberta) campo.current?.focus();
    else {
      setTermo("");
      setEscolhido(0);
    }
  }, [aberta]);

  useEffect(() => setEscolhido(0), [termo]);

  const ir = (achado: Achado) => {
    setAberta(false);
    router.push(achado.href);
  };

  const naTecla = (evento: React.KeyboardEvent) => {
    if (!achados.length) return;

    if (evento.key === "ArrowDown") {
      evento.preventDefault();
      setEscolhido((antes) => (antes + 1) % achados.length);
    }

    if (evento.key === "ArrowUp") {
      evento.preventDefault();
      setEscolhido((antes) => (antes - 1 + achados.length) % achados.length);
    }

    if (evento.key === "Enter") {
      evento.preventDefault();
      ir(achados[escolhido]);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-label="Buscar na documentação"
        className={
          compacta
            ? "rounded-md p-2 text-ink-muted transition hover:bg-surface-2 hover:text-ink"
            : "flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface-1 px-3.5 py-2 text-sm text-ink-faint transition hover:border-surface-4"
        }
      >
        <Search className={compacta ? "size-5" : "size-4"} />

        {compacta ? null : (
          <>
            Buscar
            <kbd className="ml-auto rounded border border-line bg-surface-2 px-1.5 py-0.5 font-sans text-[11px] text-ink-faint">
              ⌘K
            </kbd>
          </>
        )}
      </button>

      {aberta ? (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Fechar a busca"
            onClick={() => setAberta(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-xl overflow-hidden rounded-xl border border-line bg-surface-1 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-ink-faint" />

              <input
                ref={campo}
                value={termo}
                onChange={(evento) => setTermo(evento.target.value)}
                onKeyDown={naTecla}
                placeholder="Rota, evento, permissão, página…"
                className="w-full bg-transparent py-3.5 text-sm outline-none placeholder:text-ink-faint"
              />

              <kbd className="shrink-0 rounded border border-line bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-faint">
                esc
              </kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-2">
              {termo && !achados.length ? (
                <p className="px-3 py-8 text-center text-sm text-ink-faint">
                  Nada com “{termo}”.
                </p>
              ) : null}

              {!termo ? (
                <p className="px-3 py-8 text-center text-sm text-ink-faint">
                  Busque por qualquer coisa da referência — <code>message:send</code>,{" "}
                  <code>SHARE_SCREEN</code>, <code>/bot/eu</code>.
                </p>
              ) : null}

              {achados.map((achado, indice) => (
                <button
                  key={`${achado.tipo}-${achado.titulo}-${achado.href}`}
                  type="button"
                  onClick={() => ir(achado)}
                  onMouseEnter={() => setEscolhido(indice)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${
                    indice === escolhido ? "bg-surface-3" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{achado.titulo}</span>
                    <span className="block truncate text-xs text-ink-faint">
                      {achado.contexto}
                    </span>
                  </span>

                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${COR_DO_TIPO[achado.tipo]}`}
                  >
                    {achado.tipo}
                  </span>

                  {indice === escolhido ? (
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
