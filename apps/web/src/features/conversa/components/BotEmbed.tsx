import React, { useState } from "react";
import type { Embed, GuildEmoji } from "@gravae/shared";

import { MessageContent } from "~/features/conversa/components/MessageContent";
import { formatTimestamp } from "~/lib/format";
import { cn } from "~/lib/utils";
import { useLightbox } from "~/stores/lightbox";

type MentionProps = Pick<React.ComponentProps<typeof MessageContent>, "mentions" | "mentionProfiles">;

interface BotEmbedsProps extends MentionProps {
  embeds: Embed[];
  emojis: GuildEmoji[];
}

export const BotEmbeds: React.FC<BotEmbedsProps> = ({ embeds, ...rest }) => {
  if (!embeds.length) return null;

  return (
    <div data-gc="conversa.bot-embed.div" className="mt-1 flex flex-col gap-2">
      {embeds.map((embed, index) => (
        <BotEmbed data-gc="conversa.bot-embed.bot-embed" key={index} embed={embed} {...rest} />
      ))}
    </div>
  );
};

const toHex = (color: number) => `#${color.toString(16).padStart(6, "0")}`;

const BotEmbed: React.FC<{ embed: Embed; emojis: GuildEmoji[] } & MentionProps> = ({
  embed,
  emojis,
  mentions,
  mentionProfiles,
}) => {
  const openImage = useLightbox((s) => s.open);
  const fields = embed.fields ?? [];
  const hasFooter = Boolean(embed.footer || embed.timestamp);

  return (
    <article data-gc="conversa.bot-embed.article"
      style={embed.color !== undefined ? { borderLeftColor: toHex(embed.color) } : undefined}
      className="w-full max-w-[32rem] overflow-hidden rounded-lg border-l-4 border-line bg-surface-1"
    >
      <div data-gc="conversa.bot-embed.div--2" className="flex gap-4 px-3 pb-3.5 pt-3">
        <div data-gc="conversa.bot-embed.div--3" className="min-w-0 flex-1">
          {embed.author && (
            <p data-gc="conversa.bot-embed.p" className="mb-1 flex items-center gap-2 text-[0.875em] font-semibold text-ink">
              {embed.author.iconUrl && <SmallImage data-gc="conversa.bot-embed.small-image" url={embed.author.iconUrl} className="size-6 rounded-full" />}
              {embed.author.url ? (
                <ExternalLink data-gc="conversa.bot-embed.external-link" href={embed.author.url} className="truncate hover:underline">
                  {embed.author.name}
                </ExternalLink>
              ) : (
                <span data-gc="conversa.bot-embed.span" className="truncate">{embed.author.name}</span>
              )}
            </p>
          )}

          {embed.title &&
            (embed.url ? (
              <ExternalLink data-gc="conversa.bot-embed.external-link--2" href={embed.url} className="block break-words font-semibold text-link hover:underline">
                {embed.title}
              </ExternalLink>
            ) : (
              <p data-gc="conversa.bot-embed.p--2" className="break-words font-semibold text-ink">{embed.title}</p>
            ))}

          {embed.description && (
            <div data-gc="conversa.bot-embed.div--4" className="mt-1 whitespace-pre-wrap break-words text-[0.875em] leading-[1.375] text-ink">
              <MessageContent data-gc="conversa.bot-embed.message-content"
                content={embed.description}
                emojis={emojis}
                mentions={mentions}
                mentionProfiles={mentionProfiles}
                blocks
              />
            </div>
          )}

          {fields.length > 0 && (
            <div data-gc="conversa.bot-embed.div--5" className="mt-2 grid grid-cols-6 gap-x-4 gap-y-2">
              {fields.map((field, index) => (
                <div data-gc="conversa.bot-embed.div--6"
                  key={index}
                  className={cn("min-w-0", field.inline ? "col-span-6 min-[480px]:col-span-2" : "col-span-6")}
                >
                  <p data-gc="conversa.bot-embed.p--3" className="break-words text-[0.875em] font-semibold text-ink">{field.name}</p>
                  <div data-gc="conversa.bot-embed.div--7" className="whitespace-pre-wrap break-words text-[0.875em] leading-[1.375] text-ink-muted">
                    <MessageContent data-gc="conversa.bot-embed.message-content--2"
                      content={field.value}
                      emojis={emojis}
                      mentions={mentions}
                      mentionProfiles={mentionProfiles}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {embed.imageUrl && (
            <ImageButton data-gc="conversa.bot-embed.image-button.open-image"
              url={embed.imageUrl}
              onOpen={openImage}
              className="mt-3 block max-w-full"
              imageClassName="block max-h-[18rem] w-auto max-w-full object-contain"
            />
          )}

          {hasFooter && (
            <p data-gc="conversa.bot-embed.p--4" className="mt-2 flex items-center gap-2 text-[0.75em] text-ink-faint">
              {embed.footer?.iconUrl && <SmallImage data-gc="conversa.bot-embed.small-image--2" url={embed.footer.iconUrl} className="size-5 rounded-full" />}
              <span data-gc="conversa.bot-embed.span--2" className="min-w-0 break-words">
                {embed.footer?.text}
                {embed.footer && embed.timestamp && " • "}
                {embed.timestamp && formatTimestamp(embed.timestamp)}
              </span>
            </p>
          )}
        </div>

        {embed.thumbnailUrl && (
          <ImageButton data-gc="conversa.bot-embed.image-button.open-image--2"
            url={embed.thumbnailUrl}
            onOpen={openImage}
            className="size-20 shrink-0"
            imageClassName="size-full object-contain"
          />
        )}
      </div>
    </article>
  );
};

const ExternalLink: React.FC<{ href: string; className?: string; children: React.ReactNode }> = ({
  href,
  className,
  children,
}) => (
  <a data-gc="conversa.bot-embed.a" href={href} target="_blank" rel="noreferrer noopener" className={className}>
    {children}
  </a>
);

const ImageButton: React.FC<{
  url: string;
  onOpen: (url: string) => void;
  className?: string;
  imageClassName?: string;
}> = ({ url, onOpen, className, imageClassName }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <button data-gc="conversa.bot-embed.button"
      type="button"
      onClick={() => onOpen(url)}
      className={cn("overflow-hidden rounded transition hover:brightness-110", className)}
    >
      <img data-gc="conversa.bot-embed.img"
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className={imageClassName}
      />
    </button>
  );
};

const SmallImage: React.FC<{ url: string; className?: string }> = ({ url, className }) => {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    <img data-gc="conversa.bot-embed.img--2"
      src={url}
      alt=""
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("shrink-0", className)}
    />
  );
};
