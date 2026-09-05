import React, { useState } from "react";
import { ArrowLeft, ImagePlus, Search, Sparkles } from "lucide-react";

import type { GifModel } from "~/@core/application/requests/gif/gifs";
import { GradeDeGifs } from "~/features/expressao/components/GradeDeGifs";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";

interface SeletorDeImagemProps {
  open: boolean;
  onClose: () => void;
  onArquivo: () => void;
  onGif: (gif: GifModel) => void;
  titulo?: string;
  rodape?: React.ReactNode;
}

export const SeletorDeImagem: React.FC<SeletorDeImagemProps> = ({
  open,
  onClose,
  onArquivo,
  onGif,
  titulo = "Selecione uma imagem",
  rodape,
}) => {
  const [aba, setAba] = useState<"escolha" | "gif">("escolha");
  const [busca, setBusca] = useState("");

  const fechar = () => {
    setAba("escolha");
    setBusca("");
    onClose();
  };

  return (
    <Dialog data-gc="seletor-de-imagem.dialog" open={open} onOpenChange={(aberto) => !aberto && fechar()}>
      <DialogContent data-gc="seletor-de-imagem.dialog-content"
        className={cn(
          "flex max-h-[85vh] flex-col",
          aba === "gif" ? "max-w-2xl" : "max-w-lg",
        )}
      >
        <div data-gc="seletor-de-imagem.div" className="flex items-center gap-2 px-5 pt-5">
          {aba === "gif" && (
            <button data-gc="seletor-de-imagem.button"
              onClick={() => setAba("escolha")}
              aria-label="Voltar"
              className="rounded p-1 text-ink-muted transition hover:bg-surface-4 hover:text-ink"
            >
              <ArrowLeft data-gc="seletor-de-imagem.arrow-left" size={18} />
            </button>
          )}
          <DialogTitle data-gc="seletor-de-imagem.dialog-title" className="text-lg font-semibold">
            {aba === "gif" ? "Escolher GIF" : titulo}
          </DialogTitle>
        </div>

        {aba === "escolha" ? (
          <div data-gc="seletor-de-imagem.div--2" className="p-5">
            <div data-gc="seletor-de-imagem.div--3" className="grid grid-cols-2 gap-3">
              <Opcao data-gc="seletor-de-imagem.opcao.on-arquivo" icone={<ImagePlus data-gc="seletor-de-imagem.image-plus" size={26} />} rotulo="Enviar imagem" onClick={onArquivo} />
              <Opcao data-gc="seletor-de-imagem.opcao"
                icone={<Sparkles data-gc="seletor-de-imagem.sparkles" size={26} />}
                rotulo="Escolher GIF"
                onClick={() => setAba("gif")}
              />
            </div>

            {rodape && <div data-gc="seletor-de-imagem.div--4" className="mt-4 text-xs text-ink-faint">{rodape}</div>}
          </div>
        ) : (
          <div data-gc="seletor-de-imagem.div--5" className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-3">
            <div data-gc="seletor-de-imagem.div--6" className="mb-3 flex shrink-0 items-center gap-2 rounded bg-surface-3 px-3">
              <Search data-gc="seletor-de-imagem.search" size={15} className="shrink-0 text-ink-faint" />
              <Input data-gc="seletor-de-imagem.input"
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar GIF"
                className="bg-transparent px-0 focus:ring-0"
              />
            </div>

            <div data-gc="seletor-de-imagem.div--7" className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
              <GradeDeGifs data-gc="seletor-de-imagem.grade-de-gifs"
                busca={busca}
                onGif={(gif) => {
                  onGif(gif);
                  fechar();
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

const Opcao: React.FC<{ icone: React.ReactNode; rotulo: string; onClick: () => void }> = ({
  icone,
  rotulo,
  onClick,
}) => (
  <button data-gc="seletor-de-imagem.button.on-click"
    onClick={onClick}
    className={cn(
      "flex h-36 flex-col items-center justify-center gap-2 rounded-lg bg-surface-0 text-sm font-medium",
      "text-ink-muted transition hover:bg-surface-4 hover:text-ink",
    )}
  >
    {icone}
    {rotulo}
  </button>
);
