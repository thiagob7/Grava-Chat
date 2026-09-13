import React, { useState } from "react";
import { ArrowLeft, Upload } from "lucide-react";

import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { TabGifs } from "~/features/expressao/components/seletor/AbaGifs";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { SearchField } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

interface ImagePropsPicker {
  open: boolean;
  onClose: () => void;
  onFile: () => void;
  onGif: (gif: GifModel) => void;
  title?: string;
  footer?: React.ReactNode;
}

export const ImagePicker: React.FC<ImagePropsPicker> = ({
  open,
  onClose,
  onFile,
  onGif,
  title,
  footer,
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"escolha" | "gif">("escolha");
  const [search, setSearch] = useState("");

  const close = () => {
    setTab("escolha");
    setSearch("");
    onClose();
  };

  return (
    <Dialog data-gc="seletor-de-imagem.dialog" open={open} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent data-gc="seletor-de-imagem.dialog-content"
        className={cn(
          "flex max-h-[85vh] flex-col",
          tab === "gif" ? "max-w-xl" : "max-w-lg",
        )}
      >
        <div data-gc="seletor-de-imagem.div" className="flex items-center gap-2 px-5 pt-5">
          {tab === "gif" && (
            <button data-gc="seletor-de-imagem.button"
              onClick={() => setTab("escolha")}
              aria-label="Voltar"
              className="rounded p-1 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
            >
              <ArrowLeft data-gc="seletor-de-imagem.arrow-left" size={18} />
            </button>
          )}
          <DialogTitle data-gc="seletor-de-imagem.dialog-title" className="text-lg font-semibold">
            {tab === "gif" ? t("comum.imagem.escolherGif") : (title ?? t("comum.imagem.titulo"))}
          </DialogTitle>
        </div>

        {tab === "escolha" ? (
          <div data-gc="seletor-de-imagem.div--2" className="p-5">
            <div data-gc="seletor-de-imagem.div--3" className="grid grid-cols-2 gap-3">
              <Choice data-gc="seletor-de-imagem.choice.on-file"
                icon={<Upload data-gc="seletor-de-imagem.upload" size={20} />}
                label={t("comum.imagem.enviar")}
                detail={footer}
                onClick={onFile}
              />
              <Choice data-gc="seletor-de-imagem.choice"
                icon={<span data-gc="seletor-de-imagem.span" className="text-xs font-black tracking-wide">GIF</span>}
                label={t("comum.imagem.escolherGif")}
                detail={t("comum.imagem.buscarGif")}
                onClick={() => setTab("gif")}
              />
            </div>
          </div>
        ) : (
          <div data-gc="seletor-de-imagem.div--4" className="flex h-[min(36rem,70vh)] min-h-0 flex-col pt-3">
            <SearchField data-gc="seletor-de-imagem.search-field"
              className="mx-5 mb-3 shrink-0"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder={t("comum.imagem.buscarGif")}
            />

            <div data-gc="seletor-de-imagem.div--5" className="flex min-h-0 flex-1 flex-col px-2 pb-2">
              <TabGifs data-gc="seletor-de-imagem.tab-gifs.set-search"
                search={search}
                onSearch={setSearch}
                onGif={(gif) => {
                  onGif(gif);
                  close();
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Choice: React.FC<{ icon: React.ReactNode; label: string; detail?: React.ReactNode; onClick: () => void }> = ({
  icon,
  label,
  detail,
  onClick,
}) => (
  <button data-gc="seletor-de-imagem.button.on-click"
    type="button"
    onClick={onClick}
    className={cn(
      "group flex min-h-44 flex-col items-center justify-center gap-2 rounded-xl border border-line-sutil bg-surface-1 px-4 py-5 text-center",
      "transition hover:border-brand/60 hover:bg-surface-2",
    )}
  >
    <span data-gc="seletor-de-imagem.span--2" className="flex size-12 items-center justify-center rounded-full bg-brand/15 text-brand transition group-hover:bg-brand group-hover:text-sobre-marca">
      {icon}
    </span>
    <span data-gc="seletor-de-imagem.span--3" className="text-sm font-semibold text-ink">{label}</span>
    {detail && <span data-gc="seletor-de-imagem.span--4" className="text-xs leading-5 text-ink-faint">{detail}</span>}
  </button>
);
