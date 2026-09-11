import React, { useRef, useState } from "react";
import { ArrowsOut, Pause, Play, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { Download, EyeOff, FileText, Trash2 } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { formatBytes, isImageType, MAX_IMAGE_H, MAX_IMAGE_W } from "~/lib/image";
import { VoiceMessage } from "~/features/conversa/components/MensagemDeVoz";
import { TextPreview } from "~/features/conversa/components/PreviaDeTexto";
import { isTextAttachment } from "~/features/conversa/lib/anexo-de-texto";
import {
  attachmentsArrangement,
  itemColumns,
} from "~/features/conversa/lib/grade-de-anexos";
import { ImageMenu } from "~/features/conversa/components/MenuDaImagem";
import { useLightbox } from "~/stores/lightbox";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";

interface MessageAttachmentsProps {
  attachments: Attachment[];
  onRemove?: (attachment: Attachment) => void;
}

const MAX_W = MAX_IMAGE_W;
const MAX_H = MAX_IMAGE_H;

export const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  onRemove,
}) => {
  const openImages = useAppearance((s) => s.imagesSent);
  const { t } = useTranslation();

  if (!attachments.length) return null;

  const note = attachments.find((a) => a.durationMs);
  if (note && attachments.length === 1) return <VoiceMessage data-gc="conversa.message-attachments.voice-message" attachment={note} />;

  const soImages = attachments.every((a) => isImageType(a.contentType));
  const arrangement =
    !onRemove && openImages && soImages ? attachmentsArrangement(attachments.length) : null;

  if (arrangement) {
    const inUp = arrangement.inUp ?? 0;
    const under = attachments.slice(inUp);

    const grid = (
      <div data-gc="conversa.message-attachments.div"
        className={cn(flxCls(arrangement.grid), "grid gap-1")}
        style={{ gridTemplateColumns: `repeat(${arrangement.columns}, minmax(0, 1fr))` }}
      >
        {under.map((attachment, i) => (
          <div data-gc="conversa.message-attachments.div--2"
            key={attachment.id}
            style={{ gridColumn: `span ${itemColumns(attachments.length, i)}` }}
          >
            <WithSpoiler data-gc="conversa.message-attachments.with-spoiler" attachment={attachment}>
              <GridImage data-gc="conversa.message-attachments.grid-image" attachment={attachment} />
            </WithSpoiler>
          </div>
        ))}
      </div>
    );

    return (
      <div data-gc="conversa.message-attachments.div--3"
        className={cn(
          "mt-1 max-w-[26rem]",
          flxCls("attachmentsMosaic"),
          arrangement.outside && cn(flxCls(arrangement.outside), "grid gap-1"),
        )}
      >
        {inUp > 0 && (
          <div data-gc="conversa.message-attachments.div--4"
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${inUp}, minmax(0, 1fr))` }}
          >
            {attachments.slice(0, inUp).map((attachment) => (
              <WithSpoiler data-gc="conversa.message-attachments.with-spoiler--2" key={attachment.id} attachment={attachment}>
                <GridImage data-gc="conversa.message-attachments.grid-image--2" attachment={attachment} />
              </WithSpoiler>
            ))}
          </div>
        )}

        {grid}
      </div>
    );
  }

  return (
    <div data-gc="conversa.message-attachments.div--5" className={cn("mt-1 flex flex-wrap gap-2", flxCls("attachmentsMosaic"))}>
      {attachments.map((attachment) => (
        <div data-gc="conversa.message-attachments.div--6" key={attachment.id} className="group/anexo flex w-full items-start gap-2">
          <WithSpoiler data-gc="conversa.message-attachments.with-spoiler--3" attachment={attachment}>
            {openImages && isImageType(attachment.contentType) ? (
              <ImageAttachment data-gc="conversa.message-attachments.image-attachment" attachment={attachment} />
            ) : openImages && attachment.contentType.startsWith("video/") ? (
              <VideoAttachment data-gc="conversa.message-attachments.video-attachment" attachment={attachment} />
            ) : isTextAttachment(attachment) ? (
              <TextPreview data-gc="conversa.message-attachments.text-preview" attachment={attachment} onFail={<FileAttachment data-gc="conversa.message-attachments.file-attachment" attachment={attachment} />} />
            ) : (
              <FileAttachment data-gc="conversa.message-attachments.file-attachment--2" attachment={attachment} />
            )}
          </WithSpoiler>

          {onRemove && (
            <button data-gc="conversa.message-attachments.button"
              type="button"
              onClick={() => onRemove(attachment)}
              aria-label={t("conversa.anexos.excluirTitulo")}
              title={t("conversa.anexos.excluirTitulo")}
              className="mt-1 flex size-7 shrink-0 items-center justify-center rounded text-ink-faint opacity-0 transition hover:bg-surface-3 hover:text-danger focus-visible:opacity-100 group-hover/anexo:opacity-100"
            >
              <Trash2 data-gc="conversa.message-attachments.trash2" size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const WithSpoiler: React.FC<{ attachment: Attachment; children: React.ReactNode }> = ({
  attachment,
  children,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const when = useAppearance((s) => s.spoilers);

  if (!attachment.spoiler || isOpen || when === "sempre") return <>{children}</>;

  return (
    <button data-gc="conversa.message-attachments.button--2"
      onClick={() => setIsOpen(true)}
      className={cn("group relative overflow-hidden rounded-lg", flxCls("spoilerWrapper"))}
      aria-label={t("conversa.anexos.mostrarSpoiler", { arquivo: attachment.filename })}
    >
      <span data-gc="conversa.message-attachments.span"
        className={cn("block", flxCls("spoiler"), flxCls("spoilerLine"))}
        data-revealed="false"
      >
        <div data-gc="conversa.message-attachments.div--7"
          className={cn("pointer-events-none blur-xl brightness-50", flxCls("spoilerContent"))}
        >
          {children}
        </div>
      </span>

      <span data-gc="conversa.message-attachments.span--2" className="absolute inset-0 flex items-center justify-center">
        <span data-gc="conversa.message-attachments.span--3" className="flex items-center gap-1.5 rounded-full bg-surface-0/90 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink transition group-hover:bg-surface-0">
          <EyeOff data-gc="conversa.message-attachments.eye-off" size={13} /> {t("conversa.anexos.spoilerTitulo")}
        </span>
      </span>
    </button>
  );
};

const ImageAttachment: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const { t } = useTranslation();
  const open = useLightbox((s) => s.open);

  const measure =
    attachment.width && attachment.height
      ? {
          width: Math.round(attachment.width * Math.min(1, MAX_W / attachment.width, MAX_H / attachment.height)),
          ratio: `${attachment.width} / ${attachment.height}`,
        }
      : null;

  return (
    <ImageMenu data-gc="conversa.message-attachments.image-menu" attachment={attachment}>
      <button data-gc="conversa.message-attachments.button--3"
        onClick={() => open(attachment.url, attachment.description || attachment.filename, { name: attachment.filename, size: attachment.size })}
        aria-label={t("conversa.anexos.ver", { arquivo: attachment.filename })}
        className="block max-w-full overflow-hidden rounded-lg transition hover:brightness-110"
        style={measure ? { width: measure.width } : { maxWidth: MAX_W }}
      >
        <img data-gc="conversa.message-attachments.img"
          src={attachment.url}
          alt={attachment.description || attachment.filename}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full bg-surface-1 object-cover"
          style={measure ? { aspectRatio: measure.ratio } : { maxHeight: MAX_H }}
        />
      </button>
    </ImageMenu>
  );
};

const GridImage: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const { t } = useTranslation();
  const open = useLightbox((s) => s.open);

  return (
    <ImageMenu data-gc="conversa.message-attachments.image-menu--2" attachment={attachment}>
      <button data-gc="conversa.message-attachments.button--4"
        type="button"
        onClick={() => open(attachment.url, attachment.description || attachment.filename)}
        aria-label={t("conversa.anexos.ver", { arquivo: attachment.filename })}
        className="block aspect-square overflow-hidden rounded transition hover:brightness-110"
      >
        <img data-gc="conversa.message-attachments.img--2"
          src={attachment.url}
          alt={attachment.description || attachment.filename}
          loading="lazy"
          decoding="async"
          className="size-full bg-surface-1 object-cover"
        />
      </button>
    </ImageMenu>
  );
};

const VideoAttachment: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const clock = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div data-gc="conversa.message-attachments.div--8"
      className="group/video relative max-w-full overflow-hidden rounded-lg bg-surface-0"
      style={{ maxWidth: MAX_W }}
    >
      <video data-gc="conversa.message-attachments.video.toggle"
        ref={video}
        src={attachment.url}
        preload="metadata"
        playsInline
        muted={isMuted}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        className="block max-h-[var(--max-imagem-h)] w-full cursor-pointer"
        style={{ maxHeight: MAX_H }}
      />

      <div data-gc="conversa.message-attachments.div--9"
        className={cn(
          flxCls("videoControls"),
          "absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-sobre-midia to-transparent px-2 py-1.5 text-xs text-sobre-marca",
          "opacity-0 transition group-hover/video:opacity-100 focus-within:opacity-100",
          !playing && "opacity-100",
        )}
      >
        <button data-gc="conversa.message-attachments.button.toggle" type="button" onClick={toggle} aria-label={playing ? "Pausar" : "Tocar"} className="rounded p-1 hover:bg-sobre-midia">
          {playing ? <Pause data-gc="conversa.message-attachments.pause" size={14} weight="fill" /> : <Play data-gc="conversa.message-attachments.play" size={14} weight="fill" />}
        </button>

        <span data-gc="conversa.message-attachments.span--4" className="tabular-nums">
          {clock(tempo)} / {clock(duration)}
        </span>

        <input data-gc="conversa.message-attachments.input"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={tempo}
          aria-label="Posição"
          onChange={(e) => {
            if (video.current) video.current.currentTime = Number(e.target.value);
          }}
          className="h-1 flex-1 cursor-pointer accent-sobre-marca"
        />

        <button data-gc="conversa.message-attachments.button--5" type="button" onClick={() => setMuted((v) => !v)} aria-label={isMuted ? "Ligar o som" : "Silenciar"} className="rounded p-1 hover:bg-sobre-midia">
          {isMuted ? <SpeakerSlash data-gc="conversa.message-attachments.speaker-slash" size={14} weight="fill" /> : <SpeakerHigh data-gc="conversa.message-attachments.speaker-high" size={14} weight="fill" />}
        </button>

        <button data-gc="conversa.message-attachments.button--6" type="button" onClick={() => void video.current?.requestFullscreen()} aria-label="Tela cheia" className="rounded p-1 hover:bg-sobre-midia">
          <ArrowsOut data-gc="conversa.message-attachments.arrows-out" size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};

const FileAttachment: React.FC<{ attachment: Attachment }> = ({ attachment }) => (
  <a data-gc="conversa.message-attachments.a"
    href={attachment.url}
    target="_blank"
    rel="noreferrer"
    {...flx("attachmentCard", "flex w-full max-w-sm items-center gap-3 rounded-lg border border-line bg-surface-1 p-3 transition hover:border-ink-faint")}
  >
    <span data-gc="conversa.message-attachments.span--5" className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-brand">
      <FileText data-gc="conversa.message-attachments.file-text" size={24} />
    </span>

    <div data-gc="conversa.message-attachments.div--10" className="min-w-0 flex-1">
      <p data-gc="conversa.message-attachments.p" className="truncate text-sm font-semibold leading-5 text-brand">{attachment.filename}</p>
      <p data-gc="conversa.message-attachments.p--2" className="text-xs leading-4 text-ink-faint">{formatBytes(attachment.size)}</p>
    </div>

    <span data-gc="conversa.message-attachments.span--6" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-hover hover:text-ink">
      <Download data-gc="conversa.message-attachments.download" size={18} />
    </span>
  </a>
);
