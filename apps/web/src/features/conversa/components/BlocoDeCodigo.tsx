import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, Expand, MoreHorizontal } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { adivinharLingua, rotuloDaLingua } from "~/features/conversa/lib/codigo";
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

/// Acima disto o bloco nasce recolhido: um despejo de trezentas linhas no meio
/// da conversa empurra todo o resto para fora da tela.
const LINHAS_ATE_RECOLHER = 15;

function tamanhoDe(codigo: string): string {
  const bytes = new TextEncoder().encode(codigo).length;

  if (bytes < 1024) return `${bytes} B`;

  return `${(bytes / 1024).toFixed(bytes < 10240 ? 1 : 0).replace(".", ",")} KB`;
}

function baixar(nome: string, codigo: string) {
  const url = URL.createObjectURL(new Blob([codigo], { type: "text/plain" }));
  const ancora = document.createElement("a");

  ancora.href = url;
  ancora.download = nome;
  document.body.appendChild(ancora);
  ancora.click();
  ancora.remove();
  URL.revokeObjectURL(url);
}

const EXTENSOES: Record<string, string> = {
  Bash: "sh",
  CSS: "css",
  HTML: "html",
  JSON: "json",
  JavaScript: "js",
  Markdown: "md",
  Python: "py",
  Ruby: "rb",
  Rust: "rs",
  SQL: "sql",
  Shell: "sh",
  TSX: "tsx",
  TypeScript: "ts",
  YAML: "yml",
};

interface BlocoDeCodigoProps {
  codigo: string;
  lingua?: string | null;
  className?: string;
}

export const BlocoDeCodigo: React.FC<BlocoDeCodigoProps> = ({
  codigo,
  lingua,
  className,
}) => {
  const { t } = useTranslation();
  const [copiado, setCopiado] = useState(false);
  const [inteiro, setInteiro] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  const linhas = codigo.split("\n").length;
  const comprido = linhas > LINHAS_ATE_RECOLHER;

  const [aberto, setAberto] = useState(!comprido);

  useEffect(() => () => clearTimeout(relogio.current), []);

  /// A cerca manda; sem ela, a gente adivinha pelo próprio código.
  const rotulo = rotuloDaLingua(lingua ?? adivinharLingua(codigo));
  const nomeDoArquivo = `trecho.${EXTENSOES[rotulo] ?? "txt"}`;

  const copiar = async () => {
    if (!(await copiarTexto(codigo))) return;

    setCopiado(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setCopiado(false), 1600);
  };

  const corpo = (
    <pre className="overflow-x-auto px-3 py-2">
      <code className="whitespace-pre font-mono text-13 leading-relaxed">{codigo}</code>
    </pre>
  );

  return (
    <>
      <div
        className={cn(
          "my-1 overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink",
          className,
        )}
      >
        {aberto && <div className="max-h-[32rem] overflow-y-auto">{corpo}</div>}

        <footer
          className={cn(
            "flex items-center gap-2 bg-codigo px-2 py-1.5",
            aberto && "border-t border-line",
          )}
        >
          {comprido && (
            <Tooltip
              label={t(aberto ? "conversa.codigo.recolher" : "conversa.codigo.expandir")}
            >
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                aria-label={t(
                  aberto ? "conversa.codigo.recolher" : "conversa.codigo.expandir",
                )}
                className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                <ChevronDown
                  size={16}
                  className={cn("transition-transform", !aberto && "-rotate-90")}
                />
              </button>
            </Tooltip>
          )}

          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="truncate text-13 font-medium">{rotulo}</span>
            <span className="shrink-0 text-11 text-ink-faint">{tamanhoDe(codigo)}</span>
          </div>

          <Tooltip
            label={t(copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria")}
          >
            <button
              type="button"
              onClick={copiar}
              aria-label={t(
                copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
              )}
              className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
            >
              {copiado ? <Check size={16} className="text-online" /> : <Copy size={16} />}
            </button>
          </Tooltip>

          <Tooltip label={t("conversa.codigo.verInteiro")}>
            <button
              type="button"
              onClick={() => setInteiro(true)}
              aria-label={t("conversa.codigo.verInteiro")}
              className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
            >
              <Expand size={16} />
            </button>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("conversa.codigo.maisOpcoes")}
                className="shrink-0 rounded p-1 text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => void copiar()}>
                {t("conversa.codigo.copiar")} <Copy size={15} />
              </DropdownMenuItem>

              <DropdownMenuItem onSelect={() => baixar(nomeDoArquivo, codigo)}>
                {t("conversa.codigo.baixar")} <Download size={15} />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
      </div>

      <Dialog open={inteiro} onOpenChange={setInteiro}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-baseline gap-2">
              {rotulo}
              <span className="text-11 font-normal text-ink-faint">
                {tamanhoDe(codigo)}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-auto bg-codigo-bloco">{corpo}</div>
        </DialogContent>
      </Dialog>
    </>
  );
};
