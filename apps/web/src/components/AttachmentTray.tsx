import React, { useState } from "react";
import { AlertCircle, EyeOff, FileText, Loader2, Pencil, X } from "lucide-react";

import type { PendingAttachment } from "~/hooks/use-attachments";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input, Label, campoBase } from "~/components/ui/input";
import { formatBytes } from "~/lib/image";
import { cn } from "~/lib/utils";

interface AttachmentTrayProps {
  items: PendingAttachment[];
  onRemove: (id: string) => void;
  onPatch: (
    id: string,
    dados: { filename?: string; description?: string | null; spoiler?: boolean },
  ) => void;
}

/** A faixa de anexos que aparece acima do campo de texto, antes de enviar. */
export const AttachmentTray: React.FC<AttachmentTrayProps> = ({ items, onRemove, onPatch }) => {
  const [editando, setEditando] = useState<PendingAttachment | null>(null);

  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-2 border-b border-line px-4 py-3">
      {items.map((item) => {
        const subindo = !item.attachment && !item.error;
        const economizou =
          item.uploadedSize !== null && item.uploadedSize < item.originalSize
            ? `${formatBytes(item.originalSize)} → ${formatBytes(item.uploadedSize)}`
            : formatBytes(item.originalSize);

        return (
          <div
            key={item.id}
            className={cn(
              "group relative w-32 overflow-hidden rounded-lg bg-surface-0 p-2",
              item.error && "ring-1 ring-danger",
            )}
          >
            <div className="absolute right-1 top-1 z-10 flex gap-0.5 opacity-0 transition group-hover:opacity-100">
              {item.attachment && (
                <button
                  onClick={() => setEditando(item)}
                  aria-label={`Modificar ${item.filename}`}
                  className="rounded bg-surface-2 p-1 text-ink-muted transition hover:text-ink"
                >
                  <Pencil size={14} />
                </button>
              )}
              <button
                onClick={() => onRemove(item.id)}
                aria-label={`Remover ${item.filename}`}
                className="rounded bg-surface-2 p-1 text-ink-muted transition hover:text-danger"
              >
                <X size={14} />
              </button>
            </div>

            {item.attachment?.spoiler && (
              <span className="absolute left-1 top-1 z-10 flex items-center gap-1 rounded bg-surface-2/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-ink-muted">
                <EyeOff size={10} /> spoiler
              </span>
            )}

            <div className="mb-1.5 flex h-20 items-center justify-center overflow-hidden rounded bg-surface-2">
              {item.previewUrl ? (
                <img
                  src={item.previewUrl}
                  alt=""
                  className={cn("size-full object-cover transition", subindo && "opacity-40")}
                />
              ) : (
                <FileText size={28} className="text-ink-faint" />
              )}

              {subindo && (
                <Loader2 size={20} className="absolute animate-spin text-ink" />
              )}
            </div>

            <p className="truncate text-xs font-medium" title={item.filename}>
              {item.filename}
            </p>

            <p className={cn("truncate text-[11px]", item.error ? "text-danger" : "text-ink-faint")}>
              {item.error ? (
                <span className="flex items-center gap-1">
                  <AlertCircle size={11} /> {item.error}
                </span>
              ) : subindo ? (
                "Enviando…"
              ) : (
                economizou
              )}
            </p>
          </div>
        );
      })}

      {editando && (
        <ModificarAnexo
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

/**
 * "Modificar anexo": nome do arquivo, texto alternativo e spoiler. O spoiler é
 * decidido aqui e não depois de enviar — a graça de esconder é ninguém ter
 * visto antes.
 */
const ModificarAnexo: React.FC<ModificarAnexoProps> = ({ item, onClose, onSalvar }) => {
  const [filename, setFilename] = useState(item.filename);
  const [descricao, setDescricao] = useState(item.attachment?.description ?? "");
  const [spoiler, setSpoiler] = useState(Boolean(item.attachment?.spoiler));

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modificar anexo</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {item.previewUrl && (
            <img
              src={item.previewUrl}
              alt=""
              className="max-h-40 w-full rounded object-contain bg-surface-0"
            />
          )}

          <div>
            <Label htmlFor="anexo-nome">Nome do arquivo</Label>
            <Input
              id="anexo-nome"
              autoFocus
              value={filename}
              maxLength={128}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="anexo-descricao">Descrição (texto alternativo)</Label>
            <textarea
              id="anexo-descricao"
              value={descricao}
              maxLength={1024}
              rows={3}
              placeholder="Adicionar uma descrição"
              onChange={(e) => setDescricao(e.target.value)}
              className={cn(campoBase, "resize-none")}
            />
            <p className="mt-1 text-xs text-ink-faint">
              Descreve a imagem para quem usa leitor de tela.
            </p>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={spoiler}
              onChange={(e) => setSpoiler(e.target.checked)}
              className="size-4 accent-brand"
            />
            <span className="text-sm">Marcar como spoiler</span>
          </label>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() =>
              onSalvar({
                filename: filename.trim() || item.filename,
                description: descricao.trim() || null,
                spoiler,
              })
            }
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
