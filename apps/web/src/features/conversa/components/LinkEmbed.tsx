import React, { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";

import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import type { EmbedModel } from "~/@core/application/requests/embed/embeds";
import { inviteLinkCode, themeLinkId } from "@gravae/shared";

import { InviteCard } from "~/features/servidor/components/CartaoDeConvite";
import { ThemeCard } from "~/features/tema/components/CartaoDeTema";
import { extractLinks } from "~/features/conversa/lib/links";
import { houseOrigins } from "~/lib/origens";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { useLightbox } from "~/stores/lightbox";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { flx, flxAttr } from "~/lib/compat-de-tema";

export const LinkEmbeds: React.FC<{ content: string }> = ({ content }) => {
  const links = useMemo(() => extractLinks(content), [content]);
  const our = useMemo(() => houseOrigins(), []);
  const outsidePreview = useAppearance((s) => s.linksPreview);

  if (!links.length) return null;

  return (
    <div data-gc="conversa.link-embed.div" className="mt-1 flex flex-col gap-2">
      {links.map((url) => {
        const theme = themeLinkId(url, our);
        if (theme) return <ThemeCard data-gc="conversa.link-embed.theme-card" key={url} themeId={theme} />;

        const invite = inviteLinkCode(url, our);
        if (invite) return <InviteCard data-gc="conversa.link-embed.invite-card" key={url} code={invite} />;

        if (!outsidePreview) return null;

        return <LinkEmbed data-gc="conversa.link-embed.link-embed" key={url} url={url} />;
      })}
    </div>
  );
};

const LinkEmbed: React.FC<{ url: string }> = ({ url }) => {
  const { data: embed } = useEmbed(url);

  if (!embed) return null;

  if (embed.kind === "imagem" && embed.image) {
    return <ImageAlone data-gc="conversa.link-embed.image-alone" url={embed.image} destination={embed.url} />;
  }

  return <Card data-gc="conversa.link-embed.card" embed={embed} />;
};

function useMeasure(address: string | null) {
  const [measure, setMeasure] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    setMeasure(null);
    if (!address) return;

    const image = new Image();
    image.referrerPolicy = "no-referrer";
    image.onload = () => setMeasure({ width: image.naturalWidth, height: image.naturalHeight });
    image.src = address;

    return () => {
      image.onload = null;
    };
  }, [address]);

  return measure;
}

const Card: React.FC<{ embed: EmbedModel }> = ({ embed }) => {
  const { t } = useTranslation();
  const [playing, setPlaying] = useState(false);
  const measure = useMeasure(embed.image);

  const coverLarge =
    embed.kind === "video" ||
    Boolean(measure && measure.width >= 400 && measure.width / measure.height >= 1.25);

  const open = () => window.open(embed.url, "_blank", "noopener,noreferrer");

  return (
    <article data-gc="conversa.link-embed.article"
      style={embed.color ? { borderLeftColor: embed.color } : undefined}
      {...flx("linkCard", "w-full max-w-[26rem] overflow-hidden rounded-lg border-l-4 border-brand bg-surface-1")}
    >
      <div data-gc="conversa.link-embed.div--2" {...flxAttr("cardLinkCore")} className="flex gap-2 px-3 pb-3.5 pt-3">
        <div data-gc="conversa.link-embed.div--3" className="min-w-0 flex-1">
          {embed.site && (
            <p data-gc="conversa.link-embed.p" className="flex items-center gap-1.5 text-[0.75em] font-medium leading-[1.333] text-ink-faint">
              {embed.favicon && <Favicon data-gc="conversa.link-embed.favicon" url={embed.favicon} />}
              <span data-gc="conversa.link-embed.span" className="truncate">{embed.site}</span>
            </p>
          )}

          {embed.title && (
            <a data-gc="conversa.link-embed.a"
              href={embed.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-0.5 line-clamp-2 block font-semibold text-link hover:underline"
            >
              {embed.title}
            </a>
          )}

          {embed.author && <p data-gc="conversa.link-embed.p--2" className="text-xs text-ink-muted">{embed.author}</p>}

          {embed.description && (
            <p data-gc="conversa.link-embed.p--3" className="mt-1 line-clamp-4 whitespace-pre-wrap text-[0.875em] leading-[1.2857] text-ink">
              {embed.description}
            </p>
          )}
        </div>

        {!coverLarge && embed.image && measure && (
          <button data-gc="conversa.link-embed.button.open"
            onClick={open}
            aria-label={t("conversa.cartao.abrir", { destino: embed.site ?? embed.url })}
            className="size-20 shrink-0 overflow-hidden rounded transition hover:brightness-110"
          >
            <img data-gc="conversa.link-embed.img"
              src={embed.image}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="size-full object-contain"
            />
          </button>
        )}
      </div>

      {coverLarge && embed.image && (
        <div data-gc="conversa.link-embed.div--4" className="px-3 pb-3">
          {playing && embed.player ? (
            <iframe data-gc="conversa.link-embed.iframe"
              src={embed.player}
              title={embed.title ?? t("conversa.cartao.tocador")}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full rounded border-0 bg-palco"
            />
          ) : (
            <Cover data-gc="conversa.link-embed.cover" embed={embed} ready={Boolean(measure)} onOpen={() => (embed.player ? setPlaying(true) : open())} />
          )}
        </div>
      )}
    </article>
  );
};

const Cover: React.FC<{ embed: EmbedModel; ready: boolean; onOpen: () => void }> = ({
  embed,
  ready,
  onOpen,
}) => {
  const { t } = useTranslation();

  return (
    <button data-gc="conversa.link-embed.button.on-open"
      onClick={onOpen}
      aria-label={
        embed.player
          ? t("conversa.cartao.tocar", { titulo: embed.title ?? t("conversa.cartao.video") })
          : t("conversa.cartao.abrir", { destino: embed.url })
      }
      className={cn(
        "group/capa relative block w-full overflow-hidden rounded transition hover:brightness-110",
        !ready && "hidden",
      )}
    >
      <img data-gc="conversa.link-embed.img--2"
        src={embed.image ?? ""}
        alt={embed.title ?? ""}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="block max-h-[15rem] w-full object-cover"
      />

      {embed.player && (
        <span data-gc="conversa.link-embed.span--2" className="absolute inset-0 flex items-center justify-center">
          <span data-gc="conversa.link-embed.span--3" className="flex size-12 items-center justify-center rounded-full bg-sobre-midia text-palco-ink transition group-hover/capa:bg-brand">
            <Play data-gc="conversa.link-embed.play" size={22} className="ml-0.5 fill-current" />
          </span>
        </span>
      )}
    </button>
  );
};

const Favicon: React.FC<{ url: string }> = ({ url }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img data-gc="conversa.link-embed.img--3"
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className="size-4 shrink-0 rounded-sm object-contain"
    />
  );
};

const ImageAlone: React.FC<{ url: string; destination: string }> = ({ url, destination }) => {
  const { t } = useTranslation();
  const openImage = useLightbox((s) => s.open);
  const measure = useMeasure(url);

  if (!measure) return null;

  return (
    <button data-gc="conversa.link-embed.button"
      onClick={() => openImage(destination)}
      aria-label={t("conversa.cartao.verImagem")}
      className="block max-w-full overflow-hidden rounded transition hover:brightness-110"
      style={{ width: Math.min(measure.width, 420) }}
    >
      <img data-gc="conversa.link-embed.img--4"
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{ aspectRatio: `${measure.width} / ${measure.height}` }}
        className="block h-auto w-full object-cover"
      />
    </button>
  );
};
