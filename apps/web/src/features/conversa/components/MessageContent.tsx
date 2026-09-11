import React from "react";
import type { GuildEmoji } from "@gravae/shared";

import { TextLink } from "~/features/conversa/components/LinkDoTexto";
import { Emoji } from "~/features/expressao/components/Emoji";
import { EMOJI } from "~/features/expressao/lib/twemoji";

import { CodeBlock } from "~/features/conversa/components/BlocoDeCodigo";
import type { ResolveMentions } from "~/features/conversa/hooks/use-mencoes";
import { fromCode } from "~/features/conversa/lib/codigo";
import {
  fromNotices,
  NOTICE_LABEL,
  type NoticeKind,
} from "~/features/conversa/lib/avisos";
import { readable } from "~/features/perfil/lib/contraste";
import { MAX_IMAGE_H, MAX_IMAGE_W } from "~/lib/image";
import { IS_IMAGE, LINK, clearLink, SO_UM_LINK } from "~/features/conversa/lib/links";
import { useLightbox } from "~/stores/lightbox";
import { useAppearance } from "~/features/configuracoes/stores/aparencia";
import { i18next, useTranslation } from "~/traducao";
import { cn } from "~/lib/utils";
import { flxCls, type Places } from "~/lib/compat-de-tema";

const RICH = /:([a-zA-Z0-9_]{2,32}):|<@&([a-f\d]{24})>|<@([a-f\d]{24})>|@(everyone|here)\b/g;

interface MessageContentProps {
  content: string;
  emojis: GuildEmoji[];
  className?: string;
  mentions?: ResolveMentions;
  blocks?: boolean;
}

const Pill: React.FC<{
  children: React.ReactNode;
  color?: string | null;
  title?: string;
  family?: "mention" | "everyone" | "here";
}> = ({ children, color, title, family = "mention" }) => (
  <span data-gc="conversa.message-content.span"
    title={title}
    className={cn("rounded px-1 py-px font-medium", flxCls("mention"))}
    style={
      color
        ? { color: readable(color), backgroundColor: `${readable(color)}26` }
        : {
            color: `var(--color-${family})`,
            backgroundColor: `color-mix(in srgb, var(--color-${family}) 15%, transparent)`,
          }
    }
  >
    {children}
  </span>
);

function withTwemoji(text: string, key: string): React.ReactNode[] {
  const matches = [...text.matchAll(EMOJI)];
  if (!matches.length) return [text];

  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of matches) {
    const start = match.index!;
    if (start > last) parts.push(text.slice(last, start));

    parts.push(<Emoji data-gc="conversa.message-content.emoji" key={`${key}-e${start}`} emoji={match[0]} />);
    last = start + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));

  return parts;
}

function enrich(
  text: string,
  byName: Map<string, GuildEmoji>,
  key: string,
  mentions?: ResolveMentions,
) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(RICH)) {
    const [whole, emoji, roleId, userId, all] = match;
    if (match.index === undefined) continue;

    const anterior = text.slice(last, match.index);
    let piece: React.ReactNode = null;
    const k = `${key}-${match.index}`;

    if (emoji) {
      const found = byName.get(emoji);
      if (found) {
        piece = (
          <img data-gc="conversa.message-content.img"
            key={k}
            src={found.url}
            alt={`:${found.name}:`}
            title={`:${found.name}:`}
            className="inline-block size-6 align-text-bottom"
          />
        );
      }
    } else if (roleId) {
      const role = mentions?.roleList.get(roleId);
      piece = (
        <Pill data-gc="conversa.message-content.pill" key={k} color={role?.color} title={i18next.t("conversa.mencao.cargo")}>
          @{role?.name ?? i18next.t("conversa.mencao.cargoSemNome")}
        </Pill>
      );
    } else if (userId) {
      piece = (
        <Pill data-gc="conversa.message-content.pill--2" key={k} title={i18next.t("conversa.mencao.pessoa")}>
          @{mentions?.names.get(userId) ?? i18next.t("conversa.mencao.alguem")}
        </Pill>
      );
    } else if (all) {
      piece = (
        <Pill data-gc="conversa.message-content.pill--3"
          key={k}
          family={all === "here" ? "here" : "everyone"}
          title={i18next.t(
            all === "here" ? "conversa.mencao.here" : "conversa.mencao.everyone",
          )}
        >
          @{all}
        </Pill>
      );
    }

    if (!piece) continue;

    if (anterior) parts.push(...withTwemoji(anterior, `${k}-a`));
    parts.push(piece);
    last = match.index + whole.length;
  }

  if (!parts.length) return withTwemoji(text, key);
  if (last < text.length) parts.push(...withTwemoji(text.slice(last), `${key}-f`));

  return parts;
}

const NOTICE_COLOR: Record<NoticeKind, string> = {
  note: "var(--alert-note-color, var(--color-link))",
  tip: "var(--alert-tip-color, var(--color-online))",
  important: "var(--alert-important-color, var(--color-everyone))",
  warning: "var(--alert-warning-color, var(--color-aviso))",
  caution: "var(--alert-caution-color, var(--color-danger))",
};

const NOTICE_CLASS: Record<NoticeKind, Places> = {
  note: "noticeNote",
  tip: "noticeHint",
  important: "noticeImportant",
  warning: "noticeAttention",
  caution: "noticeCaution",
};

const Notice: React.FC<{ kind: NoticeKind; children: React.ReactNode }> = ({
  kind,
  children,
}) => (
  <div data-gc="conversa.message-content.div"
    className={cn(
      flxCls("markdownNotice"),
      flxCls(NOTICE_CLASS[kind]),
      "my-1 rounded border-l-2 py-1.5 pl-2.5 pr-2",
    )}
    style={{
      borderColor: NOTICE_COLOR[kind],
      background: `color-mix(in srgb, ${NOTICE_COLOR[kind]} 8%, transparent)`,
    }}
  >
    <p data-gc="conversa.message-content.p"
      className={cn(flxCls("noticeTitle"), "mb-0.5 text-xs font-semibold")}
      style={{ color: NOTICE_COLOR[kind] }}
    >
      {NOTICE_LABEL[kind]}
    </p>
    <div data-gc="conversa.message-content.div--2" className={flxCls("noticeBody")}>{children}</div>
  </div>
);

const Quote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div data-gc="conversa.message-content.div--3" className={cn(flxCls("quote"), "my-1 flex gap-2")}>
    <span data-gc="conversa.message-content.span--2"
      aria-hidden
      className={cn(flxCls("quoteDivider"), "w-0.5 shrink-0 rounded-full bg-line")}
    />
    <div data-gc="conversa.message-content.div--4" className="min-w-0 flex-1 text-ink-muted">{children}</div>
  </div>
);

function running(
  text: string,
  byName: Map<string, GuildEmoji>,
  key: string,
  mentions?: ResolveMentions,
) {
  const parts: React.ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(LINK)) {
    if (match.index === undefined) continue;

    const url = clearLink(match[0]);
    if (match.index > last) {
      parts.push(...enrich(text.slice(last, match.index), byName, `${key}-${last}`, mentions));
    }

    parts.push(
      <TextLink data-gc="conversa.message-content.text-link" key={`${key}-l${match.index}`} url={url} />,
    );

    last = match.index + url.length;
  }

  if (last < text.length) {
    parts.push(...enrich(text.slice(last), byName, `${key}-${last}`, mentions));
  }

  return parts;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  emojis,
  className,
  mentions,
  blocks = false,
}) => {
  useTranslation();

  const openImage = useLightbox((s) => s.open);
  const openLinksImages = useAppearance((s) => s.linksImages);

  if (!content) return null;

  const alone = content.trim();
  if (openLinksImages && SO_UM_LINK.test(alone) && IS_IMAGE.test(clearLink(alone))) {
    return (
      <button data-gc="conversa.message-content.button"
        onClick={() => openImage(alone)}
        aria-label={i18next.t("conversa.cartao.verImagem")}
        className="mt-1 block overflow-hidden rounded transition hover:brightness-110"
      >
        <img data-gc="conversa.message-content.img--2"
          src={alone}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ maxWidth: `min(${MAX_IMAGE_W}px, 100%)`, maxHeight: MAX_IMAGE_H }}
          className="block h-auto w-auto object-contain"
        />
      </button>
    );
  }

  const byName = new Map(emojis.map((e) => [e.name, e]));
  const pieces = fromCode(content);
  const parts: React.ReactNode[] = [];
  let hasPanel = false;

  pieces.forEach((piece, i) => {
    if (piece.kind === "texto") {
      for (const [j, snippet] of fromNotices(piece.text).entries()) {
        const inside = running(snippet.text, byName, `t${i}-${j}`, mentions);

        if (snippet.kind === "texto") {
          parts.push(...inside);
          continue;
        }

        hasPanel = true;

        parts.push(
          snippet.kind === "notice" ? (
            <Notice data-gc="conversa.message-content.notice" key={`a${i}-${j}`} kind={snippet.notice}>
              {inside}
            </Notice>
          ) : (
            <Quote data-gc="conversa.message-content.quote" key={`q${i}-${j}`}>{inside}</Quote>
          ),
        );
      }

      return;
    }

    if (piece.kind === "linha" || !blocks) {
      const code =
        piece.kind === "linha" ? piece.code : piece.code.replace(/\s*\n\s*/g, " ");

      parts.push(
        <code data-gc="conversa.message-content.code" key={`c${i}`} className={cn("rounded bg-codigo px-1 py-px font-mono text-[0.9em]", flxCls("codeLine"))}>
          {code}
        </code>,
      );
      return;
    }

    hasPanel = true;
    parts.push(<CodeBlock data-gc="conversa.message-content.code-block" key={`b${i}`} code={piece.code} language={piece.language} />);
  });

  if (hasPanel)
    return (
      <div data-gc="conversa.message-content.div--5" className={cn(flxCls("textMarked"), className)}>
        {parts}
      </div>
    );

  return (
    <span data-gc="conversa.message-content.span--3" className={cn(flxCls("textMarked"), className)}>
      {parts}
    </span>
  );
};
