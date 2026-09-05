import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, FileText, Loader2, Pencil, Trash2 } from "lucide-react";

import type { PendingAttachment } from "~/features/conversa/hooks/use-attachments";
import { Button } from "~/components/ui/button";
import { Switch } from "~/components/ui/switch";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label, Textarea } from "~/components/ui/input";
import { extensaoDe } from "~/features/conversa/lib/anexo-de-texto";
import { useLightbox } from "~/stores/lightbox";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";

/*
  Um roxo mais claro que a marca, misturado na hora em vez de fixo: assim ele
  acompanha o tema e a cor de destaque que a pessoa escolher no estúdio.

  Não virou token porque o estúdio exige que todo token seja editável, e um
  derivado pararia de seguir a marca no instante em que alguém o editasse.
*/
const TINTA_SUAVE = "text-[color-mix(in_srgb,var(--color-brand)_55%,white)]";

const ARTE_DO_ARQUIVO = cn(
  TINTA_SUAVE,
  "fill-[color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
);

interface AttachmentTrayProps {
  items: PendingAttachment[];
  onRemove: (id: string) => void;
  onPatch: (
    id: string,
    dados: { filename?: string; description?: string | null; spoiler?: boolean },
  ) => void;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({ items, onRemove, onPatch }) => {
  const { t } = useTranslation();
  const [editando, setEditando] = useState<PendingAttachment | null>(null);
  const abrirLightbox = useLightbox((s) => s.abrir);

  if (!items.length) return null;

  return (
    <div data-gc="conversa.attachment-tray.div" className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
      {items.map((item) => {
        const subindo = !item.attachment && !item.error;
        const economizou =
          item.uploadedSize !== null && item.uploadedSize < item.originalSize
            ? `${formatBytes(item.originalSize)} → ${formatBytes(item.uploadedSize)}`
            : formatBytes(item.originalSize);

        return (
          <div data-gc="conversa.attachment-tray.div--2"
            key={item.id}
            className={cn(
              "group relative w-40 overflow-hidden rounded-lg bg-surface-0 p-2",
              item.error && "ring-1 ring-danger",
            )}
          >
            <div data-gc="conversa.attachment-tray.div--3" className="absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 rounded-lg bg-surface-3 p-0.5 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
              {item.previewUrl && (
                <button data-gc="conversa.attachment-tray.button"
                  onClick={() => abrirLightbox(item.previewUrl!, item.filename)}
                  aria-label={t("conversa.anexos.verPrevia", { arquivo: item.filename })}
                  title={t("conversa.anexos.verPrevia", { arquivo: item.filename })}
                  className="flex size-6 items-center justify-center rounded text-ink-muted transition hover:bg-hover hover:text-ink"
                >
                  <Eye data-gc="conversa.attachment-tray.eye" size={14} />
                </button>
              )}

              {item.attachment && (
                <button data-gc="conversa.attachment-tray.button--2"
                  onClick={() => setEditando(item)}
                  aria-label={t("conversa.anexos.modificar", { arquivo: item.filename })}
                  title={t("conversa.anexos.modificar", { arquivo: item.filename })}
                  className="flex size-6 items-center justify-center rounded text-ink-muted transition hover:bg-hover hover:text-ink"
                >
                  <Pencil data-gc="conversa.attachment-tray.pencil" size={14} />
                </button>
              )}

              <button data-gc="conversa.attachment-tray.button--3"
                onClick={() => onRemove(item.id)}
                aria-label={t("conversa.anexos.remover", { arquivo: item.filename })}
                title={t("conversa.anexos.remover", { arquivo: item.filename })}
                className="flex size-6 items-center justify-center rounded text-danger transition hover:bg-danger hover:text-white"
              >
                <Trash2 data-gc="conversa.attachment-tray.trash2" size={14} />
              </button>
            </div>

            {item.attachment?.spoiler && (
              <span data-gc="conversa.attachment-tray.span" className="absolute left-1 top-1 z-10 flex items-center gap-1 rounded bg-surface-2/90 px-1.5 py-0.5 text-10 font-semibold uppercase text-ink-muted">
                <EyeOff data-gc="conversa.attachment-tray.eye-off" size={10} /> {t("conversa.anexos.spoiler")}
              </span>
            )}

            <div data-gc="conversa.attachment-tray.div--4" className="relative mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-md bg-surface-3">
              {item.previewUrl ? (
                <img data-gc="conversa.attachment-tray.img"
                  src={item.previewUrl}
                  alt=""
                  className={cn("size-full object-cover transition", subindo && "opacity-40")}
                />
              ) : (
                <FileText data-gc="conversa.attachment-tray.file-text" size={56} strokeWidth={1.5} className={ARTE_DO_ARQUIVO} />
              )}

              {subindo && <Loader2 data-gc="conversa.attachment-tray.loader2" size={20} className="absolute animate-spin text-ink" />}
            </div>

            <div data-gc="conversa.attachment-tray.div--5" className="flex items-end gap-2">
              <div data-gc="conversa.attachment-tray.div--6" className="min-w-0 flex-1">
                <p data-gc="conversa.attachment-tray.p" className="truncate text-13 font-semibold" title={item.filename}>
                  {item.filename}
                </p>

                <p data-gc="conversa.attachment-tray.p--2"
                  className={cn(
                    "truncate text-11",
                    item.error ? "text-danger" : "text-ink-faint",
                  )}
                >
                  {item.error ? (
                    <span data-gc="conversa.attachment-tray.span--2" className="flex items-center gap-1">
                      <AlertCircle data-gc="conversa.attachment-tray.alert-circle" size={11} /> {item.error}
                    </span>
                  ) : subindo ? (
                    t("conversa.anexos.enviando")
                  ) : (
                    economizou
                  )}
                </p>
              </div>

              {!item.previewUrl && extensaoDe(item.filename) && (
                <span data-gc="conversa.attachment-tray.span--3"
                  className={cn(
                    "shrink-0 text-11 font-bold uppercase tracking-wide",
                    TINTA_SUAVE,
                  )}
                >
                  {extensaoDe(item.filename)}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {editando && (
        <ModificarAnexo data-gc="conversa.attachment-tray.modificar-anexo"
          item={editando}
          onClose={() => setEditando(null)}
          onSalvar={(dados) => {
            onPatch(editando.id, dados);
            setEditando(null);
          }}
        />
      )}
    </div>
  );
};

interface ModificarAnexoProps {
  item: PendingAttachment;
  onClose: () => void;
  onSalvar: (dados: { filename: string; description: string | null; spoiler: boolean }) => void;
}

const ModificarAnexo: React.FC<ModificarAnexoProps> = ({ item, onClose, onSalvar }) => {
  const { t } = useTranslation();
  const [filename, setFilename] = useState(item.filename);
  const [descricao, setDescricao] = useState(item.attachment?.description ?? "");
  const [spoiler, setSpoiler] = useState(Boolean(item.attachment?.spoiler));

  return (
    <Dialog data-gc="conversa.attachment-tray.dialog" open onOpenChange={(next) => !next && onClose()}>
      <DialogContent data-gc="conversa.attachment-tray.dialog-content">
        <DialogHeader data-gc="conversa.attachment-tray.dialog-header">
          <DialogTitle data-gc="conversa.attachment-tray.dialog-title">{t("conversa.anexos.editarTitulo")}</DialogTitle>
        </DialogHeader>

        <DialogBody data-gc="conversa.attachment-tray.dialog-body" className="space-y-4">
          {item.previewUrl && (
            <img data-gc="conversa.attachment-tray.img--2"
              src={item.previewUrl}
              alt=""
              className="max-h-40 w-full rounded object-contain bg-surface-0"
            />
          )}

          <div data-gc="conversa.attachment-tray.div--7">
            <Label data-gc="conversa.attachment-tray.label" htmlFor="anexo-nome">{t("conversa.anexos.nomeDoArquivo")}</Label>
            <Input data-gc="conversa.attachment-tray.input"
              id="anexo-nome"
              autoFocus
              value={filename}
              maxLength={128}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div data-gc="conversa.attachment-tray.div--8">
            <div data-gc="conversa.attachment-tray.div--9" className="flex items-baseline justify-between gap-3">
              <Label data-gc="conversa.attachment-tray.label--2" htmlFor="anexo-descricao">{t("conversa.anexos.descricao")}</Label>
              <span data-gc="conversa.attachment-tray.span--4" className="mb-1.5 shrink-0 text-xs tabular-nums text-ink-faint">
                {descricao.length}/1024
              </span>
            </div>
            <Textarea data-gc="conversa.attachment-tray.textarea"
              id="anexo-descricao"
              value={descricao}
              maxLength={1024}
              rows={3}
              placeholder={t("conversa.anexos.descricaoDica")}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>

          <div data-gc="conversa.attachment-tray.div--10" className="flex items-center justify-between gap-4">
            <span data-gc="conversa.attachment-tray.span--5" className="text-sm">{t("conversa.anexos.marcarSpoiler")}</span>
            <Switch data-gc="conversa.attachment-tray.switch.set-spoiler" checked={spoiler} onCheckedChange={setSpoiler} />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.attachment-tray.dialog-footer">
          <Button data-gc="conversa.attachment-tray.button.on-close" variant="ghost" onClick={onClose}>
            {t("conversa.anexos.cancelar")}
          </Button>
          <Button data-gc="conversa.attachment-tray.button--4"
            onClick={() =>
              onSalvar({
                filename: filename.trim() || item.filename,
                description: descricao.trim() || null,
                spoiler,
              })
            }
          >
            {t("conversa.anexos.salvar")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
