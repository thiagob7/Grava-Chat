import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Copy, Download, Expand, MoreHorizontal } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { SeletorDeIdioma } from "~/features/conversa/components/SeletorDeIdioma";
import { extensaoDe } from "~/features/conversa/lib/anexo-de-texto";
import {
  IDIOMA_AUTOMATICO,
  normalizarIdioma,
  realcar,
} from "~/features/conversa/lib/realce";
import { api } from "~/@core/lib/api";
import { copiarTexto } from "~/lib/copiar";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

/// Quantas linhas ficam à mostra com o cartão recolhido. Recolhido não é
/// fechado: dá pra saber o que tem ali sem abrir.
const LINHAS_NA_PREVIA = 5;
const LINHAS_ATE_RECOLHER = 15;

interface PreviaDeTextoProps {
  anexo: Attachment;
  /// O que mostrar quando o arquivo não desce — cartão de anexo comum.
  aoFalhar: React.ReactNode;
}

export const PreviaDeTexto: React.FC<PreviaDeTextoProps> = ({ anexo, aoFalhar }) => {
  const { t } = useTranslation();

  const [conteudo, setConteudo] = useState<string | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [inteiro, setInteiro] = useState(false);
  const [quebrar, setQuebrar] = useState(false);
  const [idioma, setIdioma] = useState(() =>
    normalizarIdioma(extensaoDe(anexo.filename)),
  );
  const [html, setHtml] = useState<string | null>(null);
  const [detectado, setDetectado] = useState<string | null>(null);

  const relogio = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(relogio.current), []);

  useEffect(() => {
    let vivo = true;

    /*
      Passa pela nossa API de propósito: o bucket público do R2 não devolve
      CORS, então buscar direto daqui é recusado pelo navegador.
    */
    void api
      .get<{ conteudo: string }>("/anexos/texto", { params: { url: anexo.url } })
      .then(({ data }) => vivo && setConteudo(data.conteudo))
      .catch(() => vivo && setFalhou(true));

    return () => {
      vivo = false;
    };
  }, [anexo.url]);

  useEffect(() => {
    if (conteudo === null) return;

    let vivo = true;

    void realcar(conteudo, idioma)
      .then((realce) => {
        if (!vivo) return;

        setHtml(realce.html);
        setDetectado(realce.idioma);
      })
      .catch(() => undefined);

    return () => {
      vivo = false;
    };
  }, [conteudo, idioma]);

  if (falhou) return <>{aoFalhar}</>;

  if (conteudo === null) {
    return (
      <div className="h-28 w-full max-w-4xl animate-pulse rounded-md border border-line bg-codigo-bloco" />
    );
  }

  const linhas = conteudo.split("\n");
  const comprido = linhas.length > LINHAS_ATE_RECOLHER;
  const efetivo = idioma === IDIOMA_AUTOMATICO ? detectado : idioma;

  const copiar = async () => {
    if (!(await copiarTexto(conteudo))) return;

    setCopiado(true);
    clearTimeout(relogio.current);
    relogio.current = setTimeout(() => setCopiado(false), 1600);
  };

  const dicaDoRecolher = t(
    aberto ? "conversa.codigo.recolherLinhas" : "conversa.codigo.expandirLinhas",
    { linhas: linhas.length.toLocaleString("pt-BR") },
  );

  const corpo = (
    <pre
      className={cn(
        "py-2 pl-3 pr-12 font-mono text-13 leading-relaxed",
        quebrar ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre",
      )}
    >
      {html ? (
        <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code>{conteudo}</code>
      )}
    </pre>
  );

  const botao =
    "flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-hover hover:text-ink";

  return (
    <>
      <div className="w-full max-w-4xl overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink">
        <div className="relative">
          <div
            className={cn(aberto ? "max-h-[32rem] overflow-y-auto" : "overflow-hidden")}
            style={
              aberto || !comprido
                ? undefined
                : { maxHeight: `${LINHAS_NA_PREVIA * 1.65 + 1}rem` }
            }
          >
            {corpo}
          </div>

          <Tooltip label={t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}>
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
        </div>

        <footer className="flex items-center gap-2 border-t border-line bg-codigo px-2 py-1.5">
          {comprido && (
            <Tooltip label={dicaDoRecolher}>
              <button
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                aria-label={dicaDoRecolher}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
              >
                <ChevronDown
                  size={18}
                  className={cn("transition-transform", aberto && "rotate-180")}
                />
              </button>
            </Tooltip>
          )}

          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-13 font-semibold">{anexo.filename}</p>
            <p className="text-11 text-ink-faint">{formatBytes(anexo.size)}</p>
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
              <DropdownMenuItem asChild>
                <a href={anexo.url} download={anexo.filename} target="_blank" rel="noreferrer">
                  {t("conversa.codigo.baixar")} <Download size={15} />
                </a>
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
        <DialogContent className="flex max-h-[88vh] w-[min(64rem,94vw)] max-w-none flex-col overflow-hidden bg-codigo-bloco p-0">
          <DialogTitle className="sr-only">{anexo.filename}</DialogTitle>

          <div className="relative min-h-0 flex-1 overflow-auto">
            {corpo}

            <Tooltip
              label={t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
            >
              <button
                type="button"
                onClick={copiar}
                aria-label={t(
                  copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
                )}
                className="absolute right-3 top-3 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                {copiado ? <Check size={14} className="text-online" /> : <Copy size={14} />}
              </button>
            </Tooltip>
          </div>

          <footer className="flex shrink-0 items-center gap-2 border-t border-line bg-codigo px-3 py-2">
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-13 font-semibold">{anexo.filename}</p>
              <p className="text-11 text-ink-faint">{formatBytes(anexo.size)}</p>
            </div>

            <SeletorDeIdioma idioma={idioma} onEscolher={setIdioma} />

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
                <DropdownMenuItem asChild>
                  <a
                    href={anexo.url}
                    download={anexo.filename}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("conversa.codigo.baixar")} <Download size={15} />
                  </a>
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
        </DialogContent>
      </Dialog>
    </>
  );
};
