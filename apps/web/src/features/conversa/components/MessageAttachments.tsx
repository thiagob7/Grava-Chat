import React, { useState } from "react";
import { Download, EyeOff, FileText, Trash2 } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { formatBytes, isImageType, MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { PreviaDeTexto } from "~/features/conversa/components/PreviaDeTexto";
import { ehAnexoDeTexto } from "~/features/conversa/lib/anexo-de-texto";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useTranslation } from "~/traducao";

interface MessageAttachmentsProps {
  attachments: Attachment[];
  /// Quando dá para apagar, cada anexo ganha a lixeira ao lado. Sem isto o
  /// componente segue servindo para quem só lê.
  onRemover?: (anexo: Attachment) => void;
}

const MAX_W = MAX_IMAGEM_W;
const MAX_H = MAX_IMAGEM_H;

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  onRemover,
}) => {
  const abrirImagens = useAparencia((s) => s.imagensEnviadas);
  const { t } = useTranslation();

  if (!attachments.length) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-2">
      {attachments.map((anexo) => (
        <div key={anexo.id} className="group/anexo flex w-full items-start gap-2">
          <ComSpoiler anexo={anexo}>
            {abrirImagens && isImageType(anexo.contentType) ? (
              <ImageAttachment anexo={anexo} />
            ) : ehAnexoDeTexto(anexo) ? (
              <PreviaDeTexto anexo={anexo} aoFalhar={<FileAttachment anexo={anexo} />} />
            ) : (
              <FileAttachment anexo={anexo} />
            )}
          </ComSpoiler>

          {onRemover && (
            <button
              type="button"
              onClick={() => onRemover(anexo)}
              aria-label={t("conversa.anexos.excluirTitulo")}
              title={t("conversa.anexos.excluirTitulo")}
              className="mt-1 flex size-7 shrink-0 items-center justify-center rounded text-ink-faint opacity-0 transition hover:bg-surface-3 hover:text-danger focus-visible:opacity-100 group-hover/anexo:opacity-100"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const ComSpoiler: React.FC<{ anexo: Attachment; children: React.ReactNode }> = ({
  anexo,
  children,
}) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);
  const quando = useAparencia((s) => s.spoilers);

  if (!anexo.spoiler || aberto || quando === "sempre") return <>{children}</>;

  return (
    <button
      onClick={() => setAberto(true)}
      className="group relative overflow-hidden rounded-lg"
      aria-label={t("conversa.anexos.mostrarSpoiler", { arquivo: anexo.filename })}
    >
      <div className="pointer-events-none blur-xl brightness-50">{children}</div>

      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-surface-0/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition group-hover:bg-surface-0">
          <EyeOff size={13} /> {t("conversa.anexos.spoilerTitulo")}
        </span>
      </span>
    </button>
  );
};

const ImageAttachment: React.FC<{ anexo: Attachment }> = ({ anexo }) => {
  const { t } = useTranslation();
  const abrir = useLightbox((s) => s.abrir);

  const medida =
    anexo.width && anexo.height
      ? {
          largura: Math.round(anexo.width * Math.min(1, MAX_W / anexo.width, MAX_H / anexo.height)),
          proporcao: `${anexo.width} / ${anexo.height}`,
        }
      : null;

  return (
    <button
      onClick={() => abrir(anexo.url, anexo.description || anexo.filename)}
      aria-label={t("conversa.anexos.ver", { arquivo: anexo.filename })}
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
