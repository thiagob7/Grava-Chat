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
      <div data-gc="conversa.previa-de-texto.div" className="h-28 w-full max-w-4xl animate-pulse rounded-md border border-line bg-codigo-bloco" />
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
    <pre data-gc="conversa.previa-de-texto.pre"
      className={cn(
        "py-2 pl-3 pr-12 font-mono text-13 leading-relaxed",
        quebrar ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre",
      )}
    >
      {html ? (
        <code data-gc="conversa.previa-de-texto.code" className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code data-gc="conversa.previa-de-texto.code--2">{conteudo}</code>
      )}
    </pre>
  );

  const botao =
    "flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-hover hover:text-ink";

  return (
    <>
      <div data-gc="conversa.previa-de-texto.div--2" className="w-full max-w-4xl overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink">
        <div data-gc="conversa.previa-de-texto.div--3" className="relative">
          <div data-gc="conversa.previa-de-texto.div--4"
            className={cn(aberto ? "max-h-[32rem] overflow-y-auto" : "overflow-hidden")}
            style={
              aberto || !comprido
                ? undefined
                : { maxHeight: `${LINHAS_NA_PREVIA * 1.65 + 1}rem` }
            }
          >
            {corpo}
          </div>

          <Tooltip data-gc="conversa.previa-de-texto.tooltip" label={t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}>
            <button data-gc="conversa.previa-de-texto.button.copiar"
              type="button"
              onClick={copiar}
              aria-label={t(
                copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
              )}
              className="absolute right-2 top-2 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
            >
              {copiado ? <Check data-gc="conversa.previa-de-texto.check" size={14} className="text-online" /> : <Copy data-gc="conversa.previa-de-texto.copy" size={14} />}
            </button>
          </Tooltip>
        </div>

        <footer data-gc="conversa.previa-de-texto.footer" className="flex items-center gap-2 border-t border-line bg-codigo px-2 py-1.5">
          {comprido && (
            <Tooltip data-gc="conversa.previa-de-texto.tooltip--2" label={dicaDoRecolher}>
              <button data-gc="conversa.previa-de-texto.button"
                type="button"
                onClick={() => setAberto((v) => !v)}
                aria-expanded={aberto}
                aria-label={dicaDoRecolher}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
              >
                <ChevronDown data-gc="conversa.previa-de-texto.chevron-down"
                  size={18}
                  className={cn("transition-transform", aberto && "rotate-180")}
                />
              </button>
            </Tooltip>
          )}

          <div data-gc="conversa.previa-de-texto.div--5" className="min-w-0 flex-1 leading-tight">
            <p data-gc="conversa.previa-de-texto.p" className="truncate text-13 font-semibold">{anexo.filename}</p>
            <p data-gc="conversa.previa-de-texto.p--2" className="text-11 text-ink-faint">{formatBytes(anexo.size)}</p>
          </div>

          <SeletorDeIdioma data-gc="conversa.previa-de-texto.seletor-de-idioma.set-idioma" idioma={idioma} onEscolher={setIdioma} />

          <Tooltip data-gc="conversa.previa-de-texto.tooltip--3" label={t("conversa.codigo.verInteiro")}>
            <button data-gc="conversa.previa-de-texto.button--2"
              type="button"
              onClick={() => setInteiro(true)}
              aria-label={t("conversa.codigo.verInteiro")}
              className={botao}
            >
              <Expand data-gc="conversa.previa-de-texto.expand" size={16} />
            </button>
          </Tooltip>

          <DropdownMenu data-gc="conversa.previa-de-texto.dropdown-menu">
            <DropdownMenuTrigger data-gc="conversa.previa-de-texto.dropdown-menu-trigger" asChild>
              <button data-gc="conversa.previa-de-texto.button--3"
                type="button"
                aria-label={t("conversa.codigo.maisOpcoes")}
                className={botao}
              >
                <MoreHorizontal data-gc="conversa.previa-de-texto.more-horizontal" size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="conversa.previa-de-texto.dropdown-menu-content" align="end" className="w-48">
              <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item" asChild>
                <a data-gc="conversa.previa-de-texto.a" href={anexo.url} download={anexo.filename} target="_blank" rel="noreferrer">
                  {t("conversa.codigo.baixar")} <Download data-gc="conversa.previa-de-texto.download" size={15} />
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item--2"
                onSelect={(evento) => {
                  evento.preventDefault();
                  setQuebrar((v) => !v);
                }}
              >
                {t("conversa.codigo.quebrarTexto")}
                <span data-gc="conversa.previa-de-texto.span"
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition",
                    quebrar ? "border-brand bg-brand text-white" : "border-ink-faint",
                  )}
                >
                  {quebrar && <Check data-gc="conversa.previa-de-texto.check--2" size={11} strokeWidth={3} />}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
      </div>

      <Dialog data-gc="conversa.previa-de-texto.dialog.set-inteiro" open={inteiro} onOpenChange={setInteiro}>
        <DialogContent data-gc="conversa.previa-de-texto.dialog-content" className="flex max-h-[88vh] w-[min(64rem,94vw)] max-w-none flex-col overflow-hidden bg-codigo-bloco p-0">
          <DialogTitle data-gc="conversa.previa-de-texto.dialog-title" className="sr-only">{anexo.filename}</DialogTitle>

          <div data-gc="conversa.previa-de-texto.div--6" className="relative min-h-0 flex-1 overflow-auto">
            {corpo}

            <Tooltip data-gc="conversa.previa-de-texto.tooltip--4"
              label={t(copiado ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
            >
              <button data-gc="conversa.previa-de-texto.button.copiar--2"
                type="button"
                onClick={copiar}
                aria-label={t(
                  copiado ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
                )}
                className="absolute right-3 top-3 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                {copiado ? <Check data-gc="conversa.previa-de-texto.check--3" size={14} className="text-online" /> : <Copy data-gc="conversa.previa-de-texto.copy--2" size={14} />}
              </button>
            </Tooltip>
          </div>

          <footer data-gc="conversa.previa-de-texto.footer--2" className="flex shrink-0 items-center gap-2 border-t border-line bg-codigo px-3 py-2">
            <div data-gc="conversa.previa-de-texto.div--7" className="min-w-0 flex-1 leading-tight">
              <p data-gc="conversa.previa-de-texto.p--3" className="truncate text-13 font-semibold">{anexo.filename}</p>
              <p data-gc="conversa.previa-de-texto.p--4" className="text-11 text-ink-faint">{formatBytes(anexo.size)}</p>
            </div>

            <SeletorDeIdioma data-gc="conversa.previa-de-texto.seletor-de-idioma.set-idioma--2" idioma={idioma} onEscolher={setIdioma} />

            <DropdownMenu data-gc="conversa.previa-de-texto.dropdown-menu--2">
              <DropdownMenuTrigger data-gc="conversa.previa-de-texto.dropdown-menu-trigger--2" asChild>
                <button data-gc="conversa.previa-de-texto.button--4"
                  type="button"
                  aria-label={t("conversa.codigo.maisOpcoes")}
                  className={botao}
                >
                  <MoreHorizontal data-gc="conversa.previa-de-texto.more-horizontal--2" size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent data-gc="conversa.previa-de-texto.dropdown-menu-content--2" align="end" className="w-48">
                <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item--3" asChild>
                  <a data-gc="conversa.previa-de-texto.a--2"
                    href={anexo.url}
                    download={anexo.filename}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("conversa.codigo.baixar")} <Download data-gc="conversa.previa-de-texto.download--2" size={15} />
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item--4"
                  onSelect={(evento) => {
                    evento.preventDefault();
                    setQuebrar((v) => !v);
                  }}
                >
                  {t("conversa.codigo.quebrarTexto")}
                  <span data-gc="conversa.previa-de-texto.span--2"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition",
                      quebrar ? "border-brand bg-brand text-white" : "border-ink-faint",
                    )}
                  >
                    {quebrar && <Check data-gc="conversa.previa-de-texto.check--4" size={11} strokeWidth={3} />}
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
