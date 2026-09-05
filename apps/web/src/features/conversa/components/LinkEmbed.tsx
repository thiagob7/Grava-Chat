import React, { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";

import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import type { EmbedModel } from "~/@core/application/requests/embed/embeds";
import { codigoDoConviteNoLink, idDoTemaNoLink } from "@gravae/shared";

import { CartaoDeConvite } from "~/features/servidor/components/CartaoDeConvite";
import { CartaoDeTema } from "~/features/tema/components/CartaoDeTema";
import { extrairLinks } from "~/features/conversa/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { cn } from "~/lib/utils";
import { useTranslation } from "~/traducao";
import { flx } from "~/lib/compat-fluxer";

export const LinkEmbeds: React.FC<{ content: string }> = ({ content }) => {
  const links = useMemo(() => extrairLinks(content), [content]);
  if (!links.length) return null;

  return (
    <div data-gc="conversa.link-embed.div" className="mt-1 flex flex-col gap-2">
      {links.map((url) => {
        const tema = idDoTemaNoLink(url, window.location.origin);
        if (tema) return <CartaoDeTema data-gc="conversa.link-embed.cartao-de-tema" key={url} temaId={tema} />;

        const convite = codigoDoConviteNoLink(url, window.location.origin);
        if (convite) return <CartaoDeConvite data-gc="conversa.link-embed.cartao-de-convite" key={url} codigo={convite} />;

        return <LinkEmbed data-gc="conversa.link-embed.link-embed" key={url} url={url} />;
      })}
    </div>
  );
};

const LinkEmbed: React.FC<{ url: string }> = ({ url }) => {
  const { data: embed } = useEmbed(url);

  if (!embed) return null;

  if (embed.tipo === "imagem" && embed.imagem) {
    return <ImagemSozinha data-gc="conversa.link-embed.imagem-sozinha" url={embed.imagem} destino={embed.url} />;
  }

  return <Cartao data-gc="conversa.link-embed.cartao" embed={embed} />;
};

function useMedida(endereco: string | null) {
  const [medida, setMedida] = useState<{ largura: number; altura: number } | null>(null);

  useEffect(() => {
    setMedida(null);
    if (!endereco) return;

    const imagem = new Image();
    imagem.referrerPolicy = "no-referrer";
    imagem.onload = () => setMedida({ largura: imagem.naturalWidth, altura: imagem.naturalHeight });
    imagem.src = endereco;

    return () => {
      imagem.onload = null;
    };
  }, [endereco]);

  return medida;
}

const Cartao: React.FC<{ embed: EmbedModel }> = ({ embed }) => {
  const { t } = useTranslation();
  const [tocando, setTocando] = useState(false);
  const medida = useMedida(embed.imagem);

  const capaGrande =
    embed.tipo === "video" ||
    Boolean(medida && medida.largura >= 400 && medida.largura / medida.altura >= 1.25);

  const abrir = () => window.open(embed.url, "_blank", "noopener,noreferrer");

  return (
    <article data-gc="conversa.link-embed.article"
      style={embed.cor ? { borderLeftColor: embed.cor } : undefined}
      {...flx("cartaoDeLink", "w-full max-w-[26rem] overflow-hidden rounded border-l-4 border-brand bg-surface-1")}
    >
      <div data-gc="conversa.link-embed.div--2" className="flex gap-3 p-3">
        <div data-gc="conversa.link-embed.div--3" className="min-w-0 flex-1">
          {embed.site && (
            <p data-gc="conversa.link-embed.p" className="flex items-center gap-1.5 text-xs text-ink-muted">
              {embed.favicon && <Favicon data-gc="conversa.link-embed.favicon" url={embed.favicon} />}
              <span data-gc="conversa.link-embed.span" className="truncate">{embed.site}</span>
            </p>
          )}

          {embed.titulo && (
            <a data-gc="conversa.link-embed.a"
              href={embed.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-0.5 line-clamp-2 block font-semibold text-link hover:underline"
            >
              {embed.titulo}
            </a>
          )}

          {embed.autor && <p data-gc="conversa.link-embed.p--2" className="text-xs text-ink-muted">{embed.autor}</p>}

          {embed.descricao && (
            <p data-gc="conversa.link-embed.p--3" className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-ink-muted">
              {embed.descricao}
            </p>
          )}
        </div>

        {!capaGrande && embed.imagem && medida && (
          <button data-gc="conversa.link-embed.button.abrir"
            onClick={abrir}
            aria-label={t("conversa.cartao.abrir", { destino: embed.site ?? embed.url })}
            className="size-20 shrink-0 overflow-hidden rounded transition hover:brightness-110"
          >
            <img data-gc="conversa.link-embed.img"
              src={embed.imagem}
              alt=""
              referrerPolicy="no-referrer"
              loading="lazy"
              className="size-full object-contain"
            />
          </button>
        )}
      </div>

      {capaGrande && embed.imagem && (
        <div data-gc="conversa.link-embed.div--4" className="px-3 pb-3">
          {tocando && embed.player ? (
            <iframe data-gc="conversa.link-embed.iframe"
              src={embed.player}
              title={embed.titulo ?? t("conversa.cartao.tocador")}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full rounded border-0 bg-black"
            />
          ) : (
            <Capa data-gc="conversa.link-embed.capa" embed={embed} pronta={Boolean(medida)} onAbrir={() => (embed.player ? setTocando(true) : abrir())} />
          )}
        </div>
      )}
    </article>
  );
};

const Capa: React.FC<{ embed: EmbedModel; pronta: boolean; onAbrir: () => void }> = ({
  embed,
  pronta,
  onAbrir,
}) => {
  const { t } = useTranslation();

  return (
    <button data-gc="conversa.link-embed.button.on-abrir"
      onClick={onAbrir}
      aria-label={
        embed.player
          ? t("conversa.cartao.tocar", { titulo: embed.titulo ?? t("conversa.cartao.video") })
          : t("conversa.cartao.abrir", { destino: embed.url })
      }
      className={cn(
        "group/capa relative block w-full overflow-hidden rounded transition hover:brightness-110",
        !pronta && "hidden",
      )}
    >
      <img data-gc="conversa.link-embed.img--2"
        src={embed.imagem ?? ""}
        alt={embed.titulo ?? ""}
        referrerPolicy="no-referrer"
        loading="lazy"
        className="block max-h-[15rem] w-full object-cover"
      />

      {embed.player && (
        <span data-gc="conversa.link-embed.span--2" className="absolute inset-0 flex items-center justify-center">
          <span data-gc="conversa.link-embed.span--3" className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white transition group-hover/capa:bg-brand">
            <Play data-gc="conversa.link-embed.play" size={22} className="ml-0.5 fill-current" />
          </span>
        </span>
      )}
    </button>
  );
};

const Favicon: React.FC<{ url: string }> = ({ url }) => {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return null;

  return (
    <img data-gc="conversa.link-embed.img--3"
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFalhou(true)}
      className="size-4 shrink-0 rounded-sm object-contain"
    />
  );
};

const ImagemSozinha: React.FC<{ url: string; destino: string }> = ({ url, destino }) => {
  const { t } = useTranslation();
  const abrirImagem = useLightbox((s) => s.abrir);
  const medida = useMedida(url);

  if (!medida) return null;

  return (
    <button data-gc="conversa.link-embed.button"
      onClick={() => abrirImagem(destino)}
      aria-label={t("conversa.cartao.verImagem")}
      className="block max-w-full overflow-hidden rounded transition hover:brightness-110"
      style={{ width: Math.min(medida.largura, 420) }}
    >
      <img data-gc="conversa.link-embed.img--4"
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        style={{ aspectRatio: `${medida.largura} / ${medida.altura}` }}
        className="block h-auto w-full object-cover"
      />
    </button>
  );
};
