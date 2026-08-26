import React, { useState } from "react";
import { Download, EyeOff, FileText } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { formatBytes, isImageType, MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/stores/aparencia";

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

const MAX_W = MAX_IMAGEM_W;
const MAX_H = MAX_IMAGEM_H;

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({ attachments }) => {
  /// Desligado, a foto vira a mesma linha de arquivo dos outros anexos — ela
  /// continua ali, a um clique, só não ocupa a conversa.
  const abrirImagens = useAparencia((s) => s.imagensEnviadas);

  if (!attachments.length) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {attachments.map((anexo) => (
        <ComSpoiler key={anexo.id} anexo={anexo}>
          {abrirImagens && isImageType(anexo.contentType) ? (
            <ImageAttachment anexo={anexo} />
          ) : (
            <FileAttachment anexo={anexo} />
          )}
        </ComSpoiler>
      ))}
    </div>
  );
};

const ComSpoiler: React.FC<{ anexo: Attachment; children: React.ReactNode }> = ({
  anexo,
  children,
}) => {
  const [aberto, setAberto] = useState(false);
  const quando = useAparencia((s) => s.spoilers);

  if (!anexo.spoiler || aberto || quando === "sempre") return <>{children}</>;

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

  const medida =
    anexo.width && anexo.height
      ? {
          largura: Math.round(anexo.width * Math.min(1, MAX_W / anexo.width, MAX_H / anexo.height)),
          proporcao: `${anexo.width} / ${anexo.height}`,
        }
      : null;

  /*
    A largura em pixels é um TETO, não uma medida.

    Antes ela era fixa: numa coluna de 280px — o painel da voz — a foto de
    420px passava por baixo da lista e sumia meio corpo. Agora a caixa é
    `max-w-full` e a altura vem da proporção, então a mesma imagem encolhe
    inteira em vez de ser cortada.
  */
  return (
    <button
      onClick={() => abrir(anexo.url, anexo.description || anexo.filename)}
      aria-label={`Ver ${anexo.filename}`}
      className="block max-w-full overflow-hidden rounded-lg transition hover:brightness-110"
      style={medida ? { width: medida.largura } : { maxWidth: MAX_W }}
    >
      <img
        src={anexo.url}
        alt={anexo.description || anexo.filename}
        loading="lazy"
        decoding="async"
        className="block h-auto w-full bg-surface-1 object-cover"
        style={medida ? { aspectRatio: medida.proporcao } : { maxHeight: MAX_H }}
      />
    </button>
  );
};

const FileAttachment: React.FC<{ anexo: Attachment }> = ({ anexo }) => (
  <a
    href={anexo.url}
    target="_blank"
    rel="noreferrer"
    className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-line bg-surface-1 px-3 py-2.5 transition hover:border-ink-faint"
  >
    <FileText size={28} className="shrink-0 text-brand" />

    <div className="min-w-0 flex-1">
      <p className="truncate text-sm font-medium text-brand">{anexo.filename}</p>
      <p className="text-xs text-ink-faint">{formatBytes(anexo.size)}</p>
    </div>

    <Download size={18} className="shrink-0 text-ink-muted" />
  </a>
);
