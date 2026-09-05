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
import { SeletorDeIdioma } from "~/features/conversa/components/SeletorDeIdioma";
import { adivinharLingua, rotuloDaLingua } from "~/features/conversa/lib/codigo";
import {
  IDIOMA_AUTOMATICO,
  normalizarIdioma,
  realcar,
} from "~/features/conversa/lib/realce";
import { copiarTexto } from "~/lib/copiar";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

/// Acima disto o bloco nasce recolhido — mas recolhido não é fechado: ficam
/// as primeiras linhas à mostra, senão só o rodapé aparece e ninguém sabe o
/// que tem ali dentro.
const LINHAS_ATE_RECOLHER = 15;

/// Quantas linhas ficam à mostra quando o bloco está recolhido.
const LINHAS_NA_PREVIA = 7;

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
  bash: "sh",
  cpp: "cpp",
  csharp: "cs",
  css: "css",
  go: "go",
  java: "java",
  javascript: "js",
  json: "json",
  kotlin: "kt",
  markdown: "md",
  php: "php",
  python: "py",
  ruby: "rb",
  rust: "rs",
  scss: "scss",
  shell: "sh",
  sql: "sql",
  swift: "swift",
  typescript: "ts",
  xml: "html",
  yaml: "yml",
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

  const linhas = codigo.split("\n");
  const comprido = linhas.length > LINHAS_ATE_RECOLHER;

  const [aberto, setAberto] = useState(!comprido);
  const [copiado, setCopiado] = useState(false);
  const [inteiro, setInteiro] = useState(false);
  const [quebrar, setQuebrar] = useState(false);
  const [idioma, setIdioma] = useState(() =>
    normalizarIdioma(lingua ?? adivinharLingua(codigo)),
  );
  const [html, setHtml] = useState<string | null>(null);
  const [detectado, setDetectado] = useState<string | null>(null);

  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(relogio.current), []);

  useEffect(() => {
    let vivo = true;

    void realcar(codigo, idioma)
      .then((realce) => {
        if (!vivo) return;

        setHtml(realce.html);
        setDetectado(realce.idioma);
      })
      .catch(() => undefined);

    return () => {
      vivo = false;
    };
  }, [codigo, idioma]);

  const efetivo = idioma === IDIOMA_AUTOMATICO ? detectado : idioma;
  const rotulo = rotuloDaLingua(efetivo);
  const nomeDoArquivo = `trecho.${EXTENSOES[efetivo ?? ""] ?? "txt"}`;

  const copiar = async () => {
    if (!(await copiarTexto(codigo))) return;

    setCopiado(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setCopiado(false), 1600);
  };

  const dicaDoRecolher = t(
    aberto ? "conversa.codigo.recolherLinhas" : "conversa.codigo.expandirLinhas",
    { linhas: linhas.length.toLocaleString("pt-BR") },
  );

  const corpoDe = (texto: string, realce: string | null) => (
    <pre
      className={cn(
        "px-3 py-2 font-mono text-13 leading-relaxed",
        quebrar ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre",
      )}
    >
      {realce ? (
        <code className="hljs" dangerouslySetInnerHTML={{ __html: realce }} />
      ) : (
        <code>{texto}</code>
      )}
    </pre>
  );

  const botao =
    "flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-hover hover:text-ink";

  return (
    <>
      <div
        className={cn(
          "my-1 overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink",
          className,
        )}
      >
        <div className="relative">
          {/*
            Recolhido é o mesmo bloco realçado, só que recortado na altura das
            primeiras linhas: assim a prévia sai colorida igual, sem realçar o
            texto duas vezes.
          */}
          <div
            className={cn(
              aberto ? "max-h-[32rem] overflow-y-auto" : "overflow-hidden",
            )}
            style={aberto ? undefined : { maxHeight: `${LINHAS_NA_PREVIA * 1.65 + 1}rem` }}
          >
            {corpoDe(codigo, html)}
          </div>

          {aberto && (
            <Tooltip
              label={t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
            >
              <button
                type="button"
                onClick={copiar}
                aria-label={t(
                  copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
                )}
                className="absolute right-2 top-2 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                {copiado ? <Check size={14} className="text-online" /> : <Copy size={14} />}
              </button>
            </Tooltip>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-line bg-codigo px-2 py-1.5">
          {comprido && (
            <Tooltip label={dicaDoRecolher}>
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                aria-label={dicaDoRecolher}
                className={botao}
              >
                <ChevronDown
                  size={16}
                  className={cn("transition-transform", aberto && "rotate-180")}
                />
              </button>
            </Tooltip>
          )}

          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-13 font-semibold">{rotulo}</p>
            <p className="text-11 text-ink-faint">{tamanhoDe(codigo)}</p>
          </div>

          <SeletorDeIdioma idioma={idioma} onEscolher={setIdioma} />

          <Tooltip label={t("conversa.codigo.verInteiro")}>
            <button
              type="button"
              onClick={() => setInteiro(true)}
              aria-label={t("conversa.codigo.verInteiro")}
              className={botao}
            >
              <Expand size={16} />
            </button>
          </Tooltip>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={t("conversa.codigo.maisOpcoes")}
                className={botao}
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => baixar(nomeDoArquivo, codigo)}>
                {t("conversa.codigo.baixar")} <Download size={15} />
              </DropdownMenuItem>

              <DropdownMenuItem
                onSelect={(evento) => {
                  evento.preventDefault();
                  setQuebrar((v) => !v);
                }}
              >
                {t("conversa.codigo.quebrarTexto")}
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition",
                    quebrar ? "border-brand bg-brand text-white" : "border-ink-faint",
                  )}
                >
                  {quebrar && <Check size={11} strokeWidth={3} />}
                </span>
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

          <div className="max-h-[70vh] overflow-auto bg-codigo-bloco">
            {corpoDe(codigo, html)}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
