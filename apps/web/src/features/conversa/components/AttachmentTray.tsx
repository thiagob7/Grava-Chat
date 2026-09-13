import React, { useState } from "react";
import { AlertCircle, Eye, EyeOff, FileText, Pencil, Trash2 } from "lucide-react";

import type { PendingAttachment } from "~/features/conversa/hooks/use-attachments";
import { Button, IconButton, LoadingDots } from "~/components/ui/button";
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
import { extension } from "~/features/conversa/lib/anexo-de-texto";
import { useLightbox } from "~/stores/lightbox";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";

const TINTA_SUAVE = "text-[color-mix(in_srgb,var(--color-brand)_55%,white)]";

const FILE_ART = cn(
  TINTA_SUAVE,
  "fill-[color-mix(in_srgb,var(--color-brand)_18%,transparent)]",
);

interface AttachmentTrayProps {
  items: PendingAttachment[];
  onRemove: (id: string) => void;
  onPatch: (
    id: string,
    data: { filename?: string; description?: string | null; spoiler?: boolean },
  ) => void;
}

export const AttachmentTray: React.FC<AttachmentTrayProps> = ({ items, onRemove, onPatch }) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<PendingAttachment | null>(null);
  const openLightbox = useLightbox((s) => s.open);

  if (!items.length) return null;

  return (
    <div data-gc="conversa.attachment-tray.div" {...flx("attachmentUploading", "flex gap-3 overflow-x-auto border-b border-line-sutil px-3 pb-3 pt-3")}>
      {items.map((item) => {
        const uploading = !item.attachment && !item.error;
        const saved =
          item.uploadedSize !== null && item.uploadedSize < item.originalSize
            ? `${formatBytes(item.originalSize)} → ${formatBytes(item.uploadedSize)}`
            : formatBytes(item.originalSize);

        return (
          <div data-gc="conversa.attachment-tray.div--2"
            key={item.id}
            className={cn(
              "group relative flex w-48 shrink-0 flex-col rounded-xl border bg-surface-2 p-2 transition",
              item.error ? "border-danger/60" : "border-line-sutil hover:border-line",
            )}
          >
            <div data-gc="conversa.attachment-tray.div--3" className="absolute -right-2 -top-2 z-10 flex items-center gap-0.5 rounded-lg border border-line-sutil bg-surface-1 p-0.5 opacity-0 shadow-lg transition group-hover:opacity-100 group-focus-within:opacity-100">
              {item.previewUrl && (
                <IconButton data-gc="conversa.attachment-tray.icon-button"
                  size="sm"
                  label={t("conversa.anexos.verPrevia", { arquivo: item.filename })}
                  onClick={() => openLightbox(item.previewUrl!, item.filename)}
                >
                  <Eye data-gc="conversa.attachment-tray.eye" />
                </IconButton>
              )}

              {item.attachment && (
                <IconButton data-gc="conversa.attachment-tray.icon-button--2"
                  size="sm"
                  label={t("conversa.anexos.modificar", { arquivo: item.filename })}
                  onClick={() => setEditing(item)}
                >
                  <Pencil data-gc="conversa.attachment-tray.pencil" />
                </IconButton>
              )}

              <IconButton data-gc="conversa.attachment-tray.icon-button--3"
                size="sm"
                variant="danger"
                label={t("conversa.anexos.remover", { arquivo: item.filename })}
                onClick={() => onRemove(item.id)}
              >
                <Trash2 data-gc="conversa.attachment-tray.trash2" />
              </IconButton>
            </div>

            <div data-gc="conversa.attachment-tray.div--4" className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-surface-0">
              {item.previewUrl ? (
                <img data-gc="conversa.attachment-tray.img"
                  src={item.previewUrl}
                  alt=""
                  className={cn(
                    "size-full object-contain transition",
                    uploading && "opacity-50",
                    item.attachment?.spoiler && "scale-110 blur-xl",
                  )}
                />
              ) : (
                <FileText data-gc="conversa.attachment-tray.file-text" size={48} strokeWidth={1.5} className={FILE_ART} />
              )}

              {item.attachment?.spoiler && (
                <span data-gc="conversa.attachment-tray.span" className="absolute inset-0 flex items-center justify-center">
                  <span data-gc="conversa.attachment-tray.span--2" className="flex items-center gap-1 rounded-full bg-sobre-midia px-2.5 py-1 text-11 font-semibold uppercase text-palco-ink">
                    <EyeOff data-gc="conversa.attachment-tray.eye-off" size={12} /> {t("conversa.anexos.spoiler")}
                  </span>
                </span>
              )}

              {uploading && (
                <span data-gc="conversa.attachment-tray.span--3" className="absolute inset-0 flex items-center justify-center text-ink">
                  <LoadingDots data-gc="conversa.attachment-tray.loading-dots" />
                </span>
              )}

              {!item.previewUrl && extension(item.filename) && (
                <span data-gc="conversa.attachment-tray.span--4"
                  className={cn("absolute bottom-1.5 right-2 text-11 font-bold uppercase tracking-wide", TINTA_SUAVE)}
                >
                  {extension(item.filename)}
                </span>
              )}
            </div>

            <div data-gc="conversa.attachment-tray.div--5" className="min-w-0 px-0.5 pb-0.5 pt-2">
              <p data-gc="conversa.attachment-tray.p" className="truncate text-13 font-semibold text-ink" title={item.filename}>
                {item.filename}
              </p>

              <p data-gc="conversa.attachment-tray.p--2" className={cn("mt-0.5 truncate text-11", item.error ? "text-danger" : "text-ink-faint")}>
                {item.error ? (
                  <span data-gc="conversa.attachment-tray.span--5" className="flex items-center gap-1">
                    <AlertCircle data-gc="conversa.attachment-tray.alert-circle" size={11} /> {item.error}
                  </span>
                ) : uploading ? (
                  t("conversa.anexos.enviando")
                ) : (
                  saved
                )}
              </p>
            </div>
          </div>
        );
      })}

      {editing && (
        <ModifyAttachment data-gc="conversa.attachment-tray.modify-attachment"
          item={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            onPatch(editing.id, data);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
};

interface ModifyAttachmentProps {
  item: PendingAttachment;
  onClose: () => void;
  onSave: (data: { filename: string; description: string | null; spoiler: boolean }) => void;
}

const ModifyAttachment: React.FC<ModifyAttachmentProps> = ({ item, onClose, onSave }) => {
  const { t } = useTranslation();
  const [filename, setFilename] = useState(item.filename);
  const [description, setDescription] = useState(item.attachment?.description ?? "");
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

          <div data-gc="conversa.attachment-tray.div--6">
            <Label data-gc="conversa.attachment-tray.label" htmlFor="anexo-nome">{t("conversa.anexos.nomeDoArquivo")}</Label>
            <Input data-gc="conversa.attachment-tray.input"
              id="anexo-nome"
              autoFocus
              value={filename}
              maxLength={128}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div data-gc="conversa.attachment-tray.div--7">
            <div data-gc="conversa.attachment-tray.div--8" className="flex items-baseline justify-between gap-3">
              <Label data-gc="conversa.attachment-tray.label--2" htmlFor="anexo-descricao">{t("conversa.anexos.descricao")}</Label>
              <span data-gc="conversa.attachment-tray.span--6" className="mb-1.5 shrink-0 text-xs tabular-nums text-ink-faint">
                {description.length}/1024
              </span>
            </div>
            <Textarea data-gc="conversa.attachment-tray.textarea"
              id="anexo-descricao"
              value={description}
              maxLength={1024}
              rows={3}
              placeholder={t("conversa.anexos.descricaoDica")}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div data-gc="conversa.attachment-tray.div--9" className="flex items-center justify-between gap-4">
            <span data-gc="conversa.attachment-tray.span--7" className="text-sm">{t("conversa.anexos.marcarSpoiler")}</span>
            <Switch data-gc="conversa.attachment-tray.switch.set-spoiler" checked={spoiler} onCheckedChange={setSpoiler} />
          </div>
        </DialogBody>

        <DialogFooter data-gc="conversa.attachment-tray.dialog-footer">
          <Button data-gc="conversa.attachment-tray.button.on-close" variant="ghost" onClick={onClose}>
            {t("conversa.anexos.cancelar")}
          </Button>
          <Button data-gc="conversa.attachment-tray.button"
            onClick={() =>
              onSave({
                filename: filename.trim() || item.filename,
                description: description.trim() || null,
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
