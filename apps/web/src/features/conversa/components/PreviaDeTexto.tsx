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
import { LanguagePicker } from "~/features/conversa/components/SeletorDeIdioma";
import { extension } from "~/features/conversa/lib/anexo-de-texto";
import {
  LANGUAGE_AUTOMATIC,
  normalizeLanguage,
  highlight,
} from "~/features/conversa/lib/realce";
import { api } from "~/@core/lib/api";
import { copyText } from "~/lib/copiar";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";
import { flx } from "~/lib/compat-de-tema";
import { useTranslation } from "~/traducao";

const LINES_PREVIEW = 5;
const LINES_UNTIL_COLLAPSE = 15;

interface TextPropsPreview {
  attachment: Attachment;
  onFail: React.ReactNode;
}

export const TextPreview: React.FC<TextPropsPreview> = ({ attachment, onFail }) => {
  const { t } = useTranslation();

  const [content, setContent] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [whole, setWhole] = useState(false);
  const [lineBreak, setBreak] = useState(false);
  const [language, setLanguage] = useState(() =>
    normalizeLanguage(extension(attachment.filename)),
  );
  const [html, setHtml] = useState<string | null>(null);
  const [detected, setDetected] = useState<string | null>(null);

  const clock = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(clock.current), []);

  useEffect(() => {
    let live = true;

    void api
      .get<{ content: string }>("/anexos/texto", { params: { url: attachment.url } })
      .then(({ data }) => live && setContent(data.content))
      .catch(() => live && setFailed(true));

    return () => {
      live = false;
    };
  }, [attachment.url]);

  useEffect(() => {
    if (content === null) return;

    let live = true;

    void highlight(content, language)
      .then((highlight) => {
        if (!live) return;

        setHtml(highlight.html);
        setDetected(highlight.language);
      })
      .catch(() => undefined);

    return () => {
      live = false;
    };
  }, [content, language]);

  if (failed) return <>{onFail}</>;

  if (content === null) {
    return (
      <div data-gc="conversa.previa-de-texto.div" className="h-28 w-full max-w-4xl animate-pulse rounded-md border border-line bg-codigo-bloco" />
    );
  }

  const lines = content.split("\n");
  const long = lines.length > LINES_UNTIL_COLLAPSE;
  const effective = language === LANGUAGE_AUTOMATIC ? detected : language;

  const copy = async () => {
    if (!(await copyText(content))) return;

    setCopied(true);
    clearTimeout(clock.current);
    clock.current = setTimeout(() => setCopied(false), 1600);
  };

  const collapseHint = t(
    isOpen ? "conversa.codigo.recolherLinhas" : "conversa.codigo.expandirLinhas",
    { linhas: lines.length.toLocaleString("pt-BR") },
  );

  const body = (
    <pre data-gc="conversa.previa-de-texto.pre"
      className={cn(
        "py-2 pl-3 pr-12 font-mono text-13 leading-relaxed",
        lineBreak ? "whitespace-pre-wrap break-words" : "overflow-x-auto whitespace-pre",
      )}
    >
      {html ? (
        <code data-gc="conversa.previa-de-texto.code" className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code data-gc="conversa.previa-de-texto.code--2">{content}</code>
      )}
    </pre>
  );

  const button =
    "flex size-7 shrink-0 items-center justify-center rounded text-ink-faint transition hover:bg-hover hover:text-ink";

  return (
    <>
      <div data-gc="conversa.previa-de-texto.div--2" {...flx("textPreview", "w-full max-w-4xl overflow-hidden rounded-md border border-line bg-codigo-bloco text-ink")}>
        <div data-gc="conversa.previa-de-texto.div--3" className="relative">
          <div data-gc="conversa.previa-de-texto.div--4"
            className={cn(isOpen ? "max-h-[32rem] overflow-y-auto" : "overflow-hidden")}
            style={
              isOpen || !long
                ? undefined
                : { maxHeight: `${LINES_PREVIEW * 1.65 + 1}rem` }
            }
          >
            {body}
          </div>

          <Tooltip data-gc="conversa.previa-de-texto.tooltip" label={t(copied ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}>
            <button data-gc="conversa.previa-de-texto.button.copy"
              type="button"
              onClick={copy}
              aria-label={t(
                copied ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
              )}
              className="absolute right-2 top-2 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
            >
              {copied ? <Check data-gc="conversa.previa-de-texto.check" size={14} className="text-online" /> : <Copy data-gc="conversa.previa-de-texto.copy" size={14} />}
            </button>
          </Tooltip>
        </div>

        <footer data-gc="conversa.previa-de-texto.footer" className="flex items-center gap-2 border-t border-line bg-codigo px-2 py-1.5">
          {long && (
            <Tooltip data-gc="conversa.previa-de-texto.tooltip--2" label={collapseHint}>
              <button data-gc="conversa.previa-de-texto.button"
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-expanded={isOpen}
                aria-label={collapseHint}
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
              >
                <ChevronDown data-gc="conversa.previa-de-texto.chevron-down"
                  size={18}
                  className={cn("transition-transform", isOpen && "rotate-180")}
                />
              </button>
            </Tooltip>
          )}

          <div data-gc="conversa.previa-de-texto.div--5" className="min-w-0 flex-1 leading-tight">
            <p data-gc="conversa.previa-de-texto.p" className="truncate text-13 font-semibold">{attachment.filename}</p>
            <p data-gc="conversa.previa-de-texto.p--2" className="text-11 text-ink-faint">{formatBytes(attachment.size)}</p>
          </div>

          <LanguagePicker data-gc="conversa.previa-de-texto.language-picker.set-language" language={language} onPick={setLanguage} />

          <Tooltip data-gc="conversa.previa-de-texto.tooltip--3" label={t("conversa.codigo.verInteiro")}>
            <button data-gc="conversa.previa-de-texto.button--2"
              type="button"
              onClick={() => setWhole(true)}
              aria-label={t("conversa.codigo.verInteiro")}
              className={button}
            >
              <Expand data-gc="conversa.previa-de-texto.expand" size={16} />
            </button>
          </Tooltip>

          <DropdownMenu data-gc="conversa.previa-de-texto.dropdown-menu">
            <DropdownMenuTrigger data-gc="conversa.previa-de-texto.dropdown-menu-trigger" asChild>
              <button data-gc="conversa.previa-de-texto.button--3"
                type="button"
                aria-label={t("conversa.codigo.maisOpcoes")}
                className={button}
              >
                <MoreHorizontal data-gc="conversa.previa-de-texto.more-horizontal" size={16} />
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent data-gc="conversa.previa-de-texto.dropdown-menu-content" align="end" className="w-48">
              <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item" asChild>
                <a data-gc="conversa.previa-de-texto.a" href={attachment.url} download={attachment.filename} target="_blank" rel="noreferrer">
                  {t("conversa.codigo.baixar")} <Download data-gc="conversa.previa-de-texto.download" size={15} />
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item--2"
                onSelect={(event) => {
                  event.preventDefault();
                  setBreak((v) => !v);
                }}
              >
                {t("conversa.codigo.quebrarTexto")}
                <span data-gc="conversa.previa-de-texto.span"
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border transition",
                    lineBreak ? "border-brand bg-brand text-sobre-marca" : "border-ink-faint",
                  )}
                >
                  {lineBreak && <Check data-gc="conversa.previa-de-texto.check--2" size={11} strokeWidth={3} />}
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </footer>
      </div>

      <Dialog data-gc="conversa.previa-de-texto.dialog.set-whole" open={whole} onOpenChange={setWhole}>
        <DialogContent data-gc="conversa.previa-de-texto.dialog-content" className="flex max-h-[88vh] w-[min(64rem,94vw)] max-w-none flex-col overflow-hidden bg-codigo-bloco p-0">
          <DialogTitle data-gc="conversa.previa-de-texto.dialog-title" className="sr-only">{attachment.filename}</DialogTitle>

          <div data-gc="conversa.previa-de-texto.div--6" className="relative min-h-0 flex-1 overflow-auto">
            {body}

            <Tooltip data-gc="conversa.previa-de-texto.tooltip--4"
              label={t(copied ? "conversa.codigo.copiado" : "conversa.codigo.copiar")}
            >
              <button data-gc="conversa.previa-de-texto.button.copy--2"
                type="button"
                onClick={copy}
                aria-label={t(
                  copied ? "conversa.codigo.copiadoAria" : "conversa.codigo.copiarAria",
                )}
                className="absolute right-3 top-3 z-[1] flex size-7 items-center justify-center rounded border border-line bg-codigo text-ink-faint transition hover:bg-hover hover:text-ink"
              >
                {copied ? <Check data-gc="conversa.previa-de-texto.check--3" size={14} className="text-online" /> : <Copy data-gc="conversa.previa-de-texto.copy--2" size={14} />}
              </button>
            </Tooltip>
          </div>

          <footer data-gc="conversa.previa-de-texto.footer--2" className="flex shrink-0 items-center gap-2 border-t border-line bg-codigo px-3 py-2">
            <div data-gc="conversa.previa-de-texto.div--7" className="min-w-0 flex-1 leading-tight">
              <p data-gc="conversa.previa-de-texto.p--3" className="truncate text-13 font-semibold">{attachment.filename}</p>
              <p data-gc="conversa.previa-de-texto.p--4" className="text-11 text-ink-faint">{formatBytes(attachment.size)}</p>
            </div>

            <LanguagePicker data-gc="conversa.previa-de-texto.language-picker.set-language--2" language={language} onPick={setLanguage} />

            <DropdownMenu data-gc="conversa.previa-de-texto.dropdown-menu--2">
              <DropdownMenuTrigger data-gc="conversa.previa-de-texto.dropdown-menu-trigger--2" asChild>
                <button data-gc="conversa.previa-de-texto.button--4"
                  type="button"
                  aria-label={t("conversa.codigo.maisOpcoes")}
                  className={button}
                >
                  <MoreHorizontal data-gc="conversa.previa-de-texto.more-horizontal--2" size={16} />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent data-gc="conversa.previa-de-texto.dropdown-menu-content--2" align="end" className="w-48">
                <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item--3" asChild>
                  <a data-gc="conversa.previa-de-texto.a--2"
                    href={attachment.url}
                    download={attachment.filename}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("conversa.codigo.baixar")} <Download data-gc="conversa.previa-de-texto.download--2" size={15} />
                  </a>
                </DropdownMenuItem>

                <DropdownMenuItem data-gc="conversa.previa-de-texto.dropdown-menu-item--4"
                  onSelect={(event) => {
                    event.preventDefault();
                    setBreak((v) => !v);
                  }}
                >
                  {t("conversa.codigo.quebrarTexto")}
                  <span data-gc="conversa.previa-de-texto.span--2"
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded border transition",
                      lineBreak ? "border-brand bg-brand text-sobre-marca" : "border-ink-faint",
                    )}
                  >
                    {lineBreak && <Check data-gc="conversa.previa-de-texto.check--4" size={11} strokeWidth={3} />}
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
