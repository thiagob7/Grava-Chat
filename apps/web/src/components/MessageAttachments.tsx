import React, { useState } from "react";
import { Download, EyeOff, FileText } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { formatBytes, isImageType, MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { useLightbox } from "~/stores/lightbox";

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

const MAX_W = MAX_IMAGEM_W;
const MAX_H = MAX_IMAGEM_H;

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ attachments }) => {
  if (!attachments.length) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {attachments.map((anexo) => (
        <ComSpoiler key={anexo.id} anexo={anexo}>
          {isImageType(anexo.contentType) ? (
            <ImageAttachment anexo={anexo} />
          ) : (
            <FileAttachment anexo={anexo} />
          )}
        </ComSpoiler>
      ))}
    </div>
  );
};

/**
 * Anexo marcado como spoiler chega borrado e só abre no clique. O conteúdo é
 * montado do mesmo jeito por baixo — o que muda é só a cortina por cima, e por
 * isso o clique já revela a imagem inteira, sem recarregar nada.
 */
const ComSpoiler: React.FC<{ anexo: Attachment; children: React.ReactNode }> = ({
  anexo,
  children,
}) => {
  const [aberto, setAberto] = useState(false);

  if (!anexo.spoiler || aberto) return <>{children}</>;

  return (
    <button
      onClick={() => setAberto(true)}
      className="group relative overflow-hidden rounded-lg"
      aria-label={`Mostrar spoiler: ${anexo.filename}`}
    >
      <div className="pointer-events-none blur-xl brightness-50">{children}</div>

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-surface-0/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition group-hover:bg-surface-0">
          <EyeOff size={13} /> Spoiler
        </span>
      </span>
    </button>
  );
};

const ImageAttachment: React.FC<{ anexo: Attachment }> = ({ anexo }) => {
  const abrir = useLightbox((s) => s.abrir);

  /**
   * Reserva o espaço exato antes de carregar. Sem isso, cada imagem que chega
   * empurra a conversa para baixo enquanto você está lendo.
   */
  const escala =
    anexo.width && anexo.height
      ? Math.min(1, MAX_W / anexo.width, MAX_H / anexo.height)
      : null;

  return (
    <button
      onClick={() => abrir(anexo.url, anexo.description || anexo.filename)}
      aria-label={`Ver ${anexo.filename}`}
      className="block overflow-hidden rounded-lg transition hover:brightness-110"
      style={
        escala && anexo.width && anexo.height
          ? { width: Math.round(anexo.width * escala), height: Math.round(anexo.height * escala) }
          : { maxWidth: MAX_W }
      }
    >
      <img
        src={anexo.url}
        alt={anexo.description || anexo.filename}
        loading="lazy"
        decoding="async"
        className="size-full bg-surface-1 object-cover"
        style={!escala ? { maxHeight: MAX_H } : undefined}
      />
    </button>
  );
};

const FileAttachment: React.FC<{ anexo: Attachment }> = ({ anexo }) => (
  <a
    href={anexo.url}
    target="_blank"
    rel="noreferrer"
    className="flex max-w-sm items-center gap-3 rounded-lg border border-line bg-surface-1 px-3 py-2.5 transition hover:border-ink-faint"
  >
    <FileText size={28} className="shrink-0 text-brand" />

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-brand">{anexo.filename}</p>
      <p className="text-xs text-ink-faint">{formatBytes(anexo.size)}</p>
    </div>

    <Download size={18} className="shrink-0 text-ink-muted" />
  </a>
);
