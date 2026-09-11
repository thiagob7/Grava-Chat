import React, { useState } from "react";
import { ArrowLeft, ImagePlus, Search, Sparkles } from "lucide-react";

import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { GifsGrid } from "~/features/expressao/components/GradeDeGifs";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
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
          tab === "gif" ? "max-w-2xl" : "max-w-lg",
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
              <Choice data-gc="seletor-de-imagem.choice.on-file" icon={<ImagePlus data-gc="seletor-de-imagem.image-plus" size={26} />} label={t("comum.imagem.enviar")} onClick={onFile} />
              <Choice data-gc="seletor-de-imagem.choice"
                icon={<Sparkles data-gc="seletor-de-imagem.sparkles" size={26} />}
                label={t("comum.imagem.escolherGif")}
                onClick={() => setTab("gif")}
              />
            </div>

            {footer && <div data-gc="seletor-de-imagem.div--4" className="mt-4 text-xs text-ink-faint">{footer}</div>}
          </div>
        ) : (
          <div data-gc="seletor-de-imagem.div--5" className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3">
            <div data-gc="seletor-de-imagem.div--6" className="mb-3 flex shrink-0 items-center gap-2 rounded bg-surface-3 px-3">
              <Search data-gc="seletor-de-imagem.search" size={15} className="shrink-0 text-ink-faint" />
              <Input data-gc="seletor-de-imagem.input"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("comum.imagem.buscarGif")}
                className="bg-transparent px-0 focus:ring-0"
              />
            </div>

            <div data-gc="seletor-de-imagem.div--7" className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
              <GifsGrid data-gc="seletor-de-imagem.gifs-grid"
                search={search}
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

const Choice: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({
  icon,
  label,
  onClick,
}) => (
  <button data-gc="seletor-de-imagem.button.on-click"
    onClick={onClick}
    className={cn(
      "flex h-36 flex-col items-center justify-center gap-2 rounded-lg bg-surface-0 text-sm font-medium",
      "text-ink-muted transition hover:bg-surface-4 hover:text-ink",
    )}
  >
    {icon}
    {label}
  </button>
);
