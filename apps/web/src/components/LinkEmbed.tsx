import React, { useEffect, useMemo, useState } from "react";
import { Play } from "lucide-react";

import { useEmbed } from "~/@core/application/queries/embed/use-embed";
import type { EmbedModel } from "~/@core/application/requests/embed/embeds";
import { extrairLinks } from "~/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { cn } from "~/lib/utils";

/**
 * Os cartões dos links de uma mensagem.
 *
 * Quem busca as metatags é o servidor (`/api/embeds`) — a página do outro
 * lado não manda CORS para o navegador, e mesmo que mandasse, cada pessoa na
 * conversa faria a sua própria visita ao site.
 */
export const LinkEmbeds: React.FC<{ content: string }> = ({ content }) => {
  const links = useMemo(() => extrairLinks(content), [content]);
  if (!links.length) return null;

  return (
    <div className="mt-1 flex flex-col gap-2">
      {links.map((url) => (
        <LinkEmbed key={url} url={url} />
      ))}
    </div>
  );
};

const LinkEmbed: React.FC<{ url: string }> = ({ url }) => {
  const { data: embed } = useEmbed(url);

  /*
    Enquanto não chega, nada aparece.

    Um esqueleto piscando embaixo de cada link seria pior que o silêncio: a
    maioria das mensagens tem link que não vira cartão nenhum, e a conversa
    ficaria pulando enquanto se lê.
  */
  if (!embed) return null;

  if (embed.tipo === "imagem" && embed.imagem) {
    return <ImagemSozinha url={embed.imagem} destino={embed.url} />;
  }

  return <Cartao embed={embed} />;
};

/**
 * A medida real da imagem, medida no navegador.
 *
 * É ela que decide entre a capa grande e a miniatura no canto — a mesma
 * escolha que o Discord faz. Dava para tentar adivinhar pelo `og:image:width`,
 * mas metade dos sites não manda (o Meet, por exemplo, não manda), e aí todo
 * logo quadrado de 512px viraria uma capa gigante.
 */
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
  const [tocando, setTocando] = useState(false);
  const medida = useMedida(embed.imagem);

  /// Vídeo é sempre capa grande: a miniatura de um vídeo com um botão de
  /// tocar do tamanho de uma unha não convida ninguém a clicar.
  const capaGrande =
    embed.tipo === "video" ||
    Boolean(medida && medida.largura >= 400 && medida.largura / medida.altura >= 1.25);

  const abrir = () => window.open(embed.url, "_blank", "noopener,noreferrer");

  return (
    <article
      /*
        A faixa da esquerda ganha a cor do site quando ele diz qual é. Sem
        isso, YouTube, GitHub e Meet chegavam com a mesma tarja vermelha da
        marca daqui — e o cartão perdia a única pista rápida de origem que ele
        tem antes de você ler o texto.
      */
      style={embed.cor ? { borderLeftColor: embed.cor } : undefined}
      className="w-full max-w-[26rem] overflow-hidden rounded border-l-4 border-brand bg-surface-1"
    >
      <div className="flex gap-3 p-3">
        <div className="min-w-0 flex-1">
          {embed.site && (
            <p className="flex items-center gap-1.5 text-xs text-ink-muted">
              {embed.favicon && <Favicon url={embed.favicon} />}
              <span className="truncate">{embed.site}</span>
            </p>
          )}

          {embed.titulo && (
            <a
              href={embed.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-0.5 line-clamp-2 block font-semibold text-link hover:underline"
            >
              {embed.titulo}
            </a>
          )}

          {embed.autor && <p className="text-xs text-ink-muted">{embed.autor}</p>}

          {embed.descricao && (
            <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm text-ink-muted">
              {embed.descricao}
            </p>
          )}
        </div>

        {/*
          A miniatura fica à direita do texto, e só existe quando a imagem já
          carregou: um quadro cinza com o ícone de imagem quebrada seria mais
          feio que cartão nenhum.
        */}
        {!capaGrande && embed.imagem && medida && (
          <button
            onClick={abrir}
            aria-label={`Abrir ${embed.site ?? embed.url}`}
            className="size-20 shrink-0 overflow-hidden rounded transition hover:brightness-110"
          >
            <img
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
        <div className="px-3 pb-3">
          {tocando && embed.player ? (
            <iframe
              src={embed.player}
              title={embed.titulo ?? "Tocador"}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="aspect-video w-full rounded border-0 bg-black"
            />
          ) : (
            <Capa embed={embed} pronta={Boolean(medida)} onAbrir={() => (embed.player ? setTocando(true) : abrir())} />
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
}) => (
  <button
    onClick={onAbrir}
    aria-label={embed.player ? `Tocar ${embed.titulo ?? "vídeo"}` : `Abrir ${embed.url}`}
    className={cn(
      "group/capa relative block w-full overflow-hidden rounded transition hover:brightness-110",
      !pronta && "hidden",
    )}
  >
    <img
      src={embed.imagem ?? ""}
      alt={embed.titulo ?? ""}
      referrerPolicy="no-referrer"
      loading="lazy"
      className="block max-h-[15rem] w-full object-cover"
    />

    {embed.player && (
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-black/60 text-white transition group-hover/capa:bg-brand">
          <Play size={22} className="ml-0.5 fill-current" />
        </span>
      </span>
    )}
  </button>
);

/// O ícone do site não pode derrubar a linha do nome dele: se não carregar,
/// some e o nome fica no lugar.
const Favicon: React.FC<{ url: string }> = ({ url }) => {
  const [falhou, setFalhou] = useState(false);
  if (falhou) return null;

  return (
    <img
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFalhou(true)}
      className="size-4 shrink-0 rounded-sm object-contain"
    />
  );
};

/// Endereço que serve imagem sem terminar em `.png` — o do R2, por exemplo.
/// Cartão nenhum: é a imagem, do mesmo tamanho das outras da conversa.
const ImagemSozinha: React.FC<{ url: string; destino: string }> = ({ url, destino }) => {
  const abrirImagem = useLightbox((s) => s.abrir);
  const medida = useMedida(url);

  if (!medida) return null;

  return (
    <button
      onClick={() => abrirImagem(destino)}
      aria-label="Ver imagem"
      className="block max-w-full overflow-hidden rounded transition hover:brightness-110"
      style={{ width: Math.min(medida.largura, 420) }}
    >
      <img
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
