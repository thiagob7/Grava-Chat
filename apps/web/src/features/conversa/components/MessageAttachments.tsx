import React, { useRef, useState } from "react";
import { ArrowsOut, Pause, Play, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { Download, EyeOff, FileText, Trash2 } from "lucide-react";
import type { Attachment } from "@gravae/shared";

import { formatBytes, isImageType, MAX_IMAGEM_H, MAX_IMAGEM_W } from "~/lib/image";
import { PreviaDeTexto } from "~/features/conversa/components/PreviaDeTexto";
import { ehAnexoDeTexto } from "~/features/conversa/lib/anexo-de-texto";
import {
  arranjoDeAnexos,
  colunasDoItem,
} from "~/features/conversa/lib/grade-de-anexos";
import { MenuDaImagem } from "~/features/conversa/components/MenuDaImagem";
import { useLightbox } from "~/stores/lightbox";
import { useAparencia } from "~/features/configuracoes/stores/aparencia";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-de-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";

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

  /*
    A grade só entra quando é só imagem e ninguém está editando: com a lixeira
    ao lado, cada anexo precisa da linha inteira, e um arquivo que não é imagem
    não tem proporção para caber numa célula.
  */
  const soImagens = attachments.every((a) => isImageType(a.contentType));
  const arranjo =
    !onRemover && abrirImagens && soImagens ? arranjoDeAnexos(attachments.length) : null;

  if (arranjo) {
    const emCima = arranjo.emCima ?? 0;
    const debaixo = attachments.slice(emCima);

    const grade = (
      <div data-gc="conversa.message-attachments.div"
        className={cn(flxCls(arranjo.grade), "grid gap-1")}
        style={{ gridTemplateColumns: `repeat(${arranjo.colunas}, minmax(0, 1fr))` }}
      >
        {debaixo.map((anexo, i) => (
          <div data-gc="conversa.message-attachments.div--2"
            key={anexo.id}
            style={{ gridColumn: `span ${colunasDoItem(attachments.length, i)}` }}
          >
            <ComSpoiler data-gc="conversa.message-attachments.com-spoiler" anexo={anexo}>
              <ImagemDaGrade data-gc="conversa.message-attachments.imagem-da-grade" anexo={anexo} />
            </ComSpoiler>
          </div>
        ))}
      </div>
    );

    return (
      <div data-gc="conversa.message-attachments.div--3"
        className={cn(
          "mt-1 max-w-[26rem]",
          flxCls("mosaicoDeAnexos"),
          arranjo.fora && cn(flxCls(arranjo.fora), "grid gap-1"),
        )}
      >
        {emCima > 0 && (
          <div data-gc="conversa.message-attachments.div--4"
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${emCima}, minmax(0, 1fr))` }}
          >
            {attachments.slice(0, emCima).map((anexo) => (
              <ComSpoiler data-gc="conversa.message-attachments.com-spoiler--2" key={anexo.id} anexo={anexo}>
                <ImagemDaGrade data-gc="conversa.message-attachments.imagem-da-grade--2" anexo={anexo} />
              </ComSpoiler>
            ))}
          </div>
        )}

        {grade}
      </div>
    );
  }

  return (
    <div data-gc="conversa.message-attachments.div--5" className={cn("mt-1 flex flex-wrap gap-2", flxCls("mosaicoDeAnexos"))}>
      {attachments.map((anexo) => (
        <div data-gc="conversa.message-attachments.div--6" key={anexo.id} className="group/anexo flex w-full items-start gap-2">
          <ComSpoiler data-gc="conversa.message-attachments.com-spoiler--3" anexo={anexo}>
            {abrirImagens && isImageType(anexo.contentType) ? (
              <ImageAttachment data-gc="conversa.message-attachments.image-attachment" anexo={anexo} />
            ) : abrirImagens && anexo.contentType.startsWith("video/") ? (
              <VideoAttachment data-gc="conversa.message-attachments.video-attachment" anexo={anexo} />
            ) : ehAnexoDeTexto(anexo) ? (
              <PreviaDeTexto data-gc="conversa.message-attachments.previa-de-texto" anexo={anexo} aoFalhar={<FileAttachment data-gc="conversa.message-attachments.file-attachment" anexo={anexo} />} />
            ) : (
              <FileAttachment data-gc="conversa.message-attachments.file-attachment--2" anexo={anexo} />
            )}
          </ComSpoiler>

          {onRemover && (
            <button data-gc="conversa.message-attachments.button"
              type="button"
              onClick={() => onRemover(anexo)}
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

const ComSpoiler: React.FC<{ anexo: Attachment; children: React.ReactNode }> = ({
  anexo,
  children,
}) => {
  const { t } = useTranslation();
  const [aberto, setAberto] = useState(false);
  const quando = useAparencia((s) => s.spoilers);

  if (!anexo.spoiler || aberto || quando === "sempre") return <>{children}</>;

  return (
    <button data-gc="conversa.message-attachments.button--2"
      onClick={() => setAberto(true)}
      className={cn("group relative overflow-hidden rounded-lg", flxCls("envoltorioDoSpoiler"))}
      aria-label={t("conversa.anexos.mostrarSpoiler", { arquivo: anexo.filename })}
    >
      {/*
        Três níveis, como na referência: `spoilerWrapper` fora, `spoiler` no meio,
        `spoilerContent` dentro. Os dois primeiros já moraram no mesmo elemento
        aqui, e aí toda regra `.spoilerWrapper .spoiler` do tema passava batido.
      */}
      <span data-gc="conversa.message-attachments.span"
        className={cn("block", flxCls("spoiler"), flxCls("spoilerEmLinha"))}
        data-revealed="false"
      >
        <div data-gc="conversa.message-attachments.div--7"
          className={cn("pointer-events-none blur-xl brightness-50", flxCls("conteudoDoSpoiler"))}
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
    <MenuDaImagem data-gc="conversa.message-attachments.menu-da-imagem" anexo={anexo}>
      <button data-gc="conversa.message-attachments.button--3"
        onClick={() => abrir(anexo.url, anexo.description || anexo.filename, { nome: anexo.filename, tamanho: anexo.size })}
        aria-label={t("conversa.anexos.ver", { arquivo: anexo.filename })}
        className="block max-w-full overflow-hidden rounded-lg transition hover:brightness-110"
        style={medida ? { width: medida.largura } : { maxWidth: MAX_W }}
      >
        <img data-gc="conversa.message-attachments.img"
          src={anexo.url}
          alt={anexo.description || anexo.filename}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full bg-surface-1 object-cover"
          style={medida ? { aspectRatio: medida.proporcao } : { maxHeight: MAX_H }}
        />
      </button>
    </MenuDaImagem>
  );
};

/*
  A imagem dentro de uma célula da grade preenche e corta. A `ImageAttachment`
  respeita a proporção do arquivo, que é o certo quando ela está sozinha e é
  exatamente o que faria a grade ficar torta.
*/
const ImagemDaGrade: React.FC<{ anexo: Attachment }> = ({ anexo }) => {
  const { t } = useTranslation();
  const abrir = useLightbox((s) => s.abrir);

  return (
    <MenuDaImagem data-gc="conversa.message-attachments.menu-da-imagem--2" anexo={anexo}>
      <button data-gc="conversa.message-attachments.button--4"
        type="button"
        onClick={() => abrir(anexo.url, anexo.description || anexo.filename)}
        aria-label={t("conversa.anexos.ver", { arquivo: anexo.filename })}
        className="block aspect-square overflow-hidden rounded transition hover:brightness-110"
      >
        <img data-gc="conversa.message-attachments.img--2"
          src={anexo.url}
          alt={anexo.description || anexo.filename}
          loading="lazy"
          decoding="async"
          className="size-full bg-surface-1 object-cover"
        />
      </button>
    </MenuDaImagem>
  );
};

/*
  Vídeo com os controles nossos, e não os do navegador.

  Os controles nativos vivem numa árvore de sombra que nem CSS nem tema
  alcançam. Uma fileira própria — tocar, tempo, som, tela cheia — é o que dá ao
  tema um elemento para pintar, e é o que faz o vídeo parecer parte do app em
  vez de um quadrado alheio no meio da conversa.
*/
const VideoAttachment: React.FC<{ anexo: Attachment }> = ({ anexo }) => {
  const video = useRef<HTMLVideoElement>(null);
  const [tocando, setTocando] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [duracao, setDuracao] = useState(0);

  const alternar = () => {
    const el = video.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };

  const relogio = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = Math.floor(segundos % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div data-gc="conversa.message-attachments.div--8"
      className="group/video relative max-w-full overflow-hidden rounded-lg bg-surface-0"
      style={{ maxWidth: MAX_W }}
    >
      <video data-gc="conversa.message-attachments.video.alternar"
        ref={video}
        src={anexo.url}
        preload="metadata"
        playsInline
        muted={mudo}
        onClick={alternar}
        onPlay={() => setTocando(true)}
        onPause={() => setTocando(false)}
        onTimeUpdate={(e) => setTempo(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuracao(e.currentTarget.duration)}
        className="block max-h-[var(--max-imagem-h)] w-full cursor-pointer"
        style={{ maxHeight: MAX_H }}
      />

      <div data-gc="conversa.message-attachments.div--9"
        className={cn(
          flxCls("controlesDoVideo"),
          "absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-sobre-midia to-transparent px-2 py-1.5 text-xs text-sobre-marca",
          "opacity-0 transition group-hover/video:opacity-100 focus-within:opacity-100",
          !tocando && "opacity-100",
        )}
      >
        <button data-gc="conversa.message-attachments.button.alternar" type="button" onClick={alternar} aria-label={tocando ? "Pausar" : "Tocar"} className="rounded p-1 hover:bg-sobre-midia">
          {tocando ? <Pause data-gc="conversa.message-attachments.pause" size={14} weight="fill" /> : <Play data-gc="conversa.message-attachments.play" size={14} weight="fill" />}
        </button>

        <span data-gc="conversa.message-attachments.span--4" className="tabular-nums">
          {relogio(tempo)} / {relogio(duracao)}
        </span>

        <input data-gc="conversa.message-attachments.input"
          type="range"
          min={0}
          max={duracao || 0}
          step={0.1}
          value={tempo}
          aria-label="Posição"
          onChange={(e) => {
            if (video.current) video.current.currentTime = Number(e.target.value);
          }}
          className="h-1 flex-1 cursor-pointer accent-sobre-marca"
        />

        <button data-gc="conversa.message-attachments.button--5" type="button" onClick={() => setMudo((v) => !v)} aria-label={mudo ? "Ligar o som" : "Silenciar"} className="rounded p-1 hover:bg-sobre-midia">
          {mudo ? <SpeakerSlash data-gc="conversa.message-attachments.speaker-slash" size={14} weight="fill" /> : <SpeakerHigh data-gc="conversa.message-attachments.speaker-high" size={14} weight="fill" />}
        </button>

        <button data-gc="conversa.message-attachments.button--6" type="button" onClick={() => void video.current?.requestFullscreen()} aria-label="Tela cheia" className="rounded p-1 hover:bg-sobre-midia">
          <ArrowsOut data-gc="conversa.message-attachments.arrows-out" size={14} weight="bold" />
        </button>
      </div>
    </div>
  );
};

const FileAttachment: React.FC<{ anexo: Attachment }> = ({ anexo }) => (
  <a data-gc="conversa.message-attachments.a"
    href={anexo.url}
    target="_blank"
    rel="noreferrer"
    {...flx("cartaoDeAnexo", "flex w-full max-w-sm items-center gap-3 rounded-lg border border-line bg-surface-1 p-3 transition hover:border-ink-faint")}
  >
    <span data-gc="conversa.message-attachments.span--5" className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-surface-3 text-brand">
      <FileText data-gc="conversa.message-attachments.file-text" size={24} />
    </span>

    <div data-gc="conversa.message-attachments.div--10" className="min-w-0 flex-1">
      <p data-gc="conversa.message-attachments.p" className="truncate text-sm font-semibold leading-5 text-brand">{anexo.filename}</p>
      <p data-gc="conversa.message-attachments.p--2" className="text-xs leading-4 text-ink-faint">{formatBytes(anexo.size)}</p>
    </div>

    <span data-gc="conversa.message-attachments.span--6" className="flex size-10 shrink-0 items-center justify-center rounded-lg text-ink-muted transition hover:bg-hover hover:text-ink">
      <Download data-gc="conversa.message-attachments.download" size={18} />
    </span>
  </a>
);
