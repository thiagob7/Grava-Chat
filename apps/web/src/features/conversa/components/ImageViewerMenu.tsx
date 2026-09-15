import React from "react";
import { Bookmark, Copy, CornerUpLeft, Download, ExternalLink, Hash, Link2, MailOpen, Search, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
  useFavoriteMessageIds,
  useToggleFavoriteMessage,
} from "~/@core/application/queries/message/use-message-favorites";
import { reactToMessage, unreadFromMessage } from "~/@core/lib/websocket/emit-message-actions";
import { useReplyStore } from "~/features/conversa/stores/reply-store";
import { copyText } from "~/lib/copiar";
import { copyImage, downloadImage } from "~/lib/imagem";
import { useLightbox } from "~/stores/lightbox";

const QUICK_REACTIONS = ["👍", "😂", "❤️", "😮"];

export const ImageViewerMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const url = useLightbox((s) => s.url);
  const alt = useLightbox((s) => s.alt);
  const info = useLightbox((s) => s.info);
  const message = useLightbox((s) => s.message);
  const close = useLightbox((s) => s.close);
  const reply = useReplyStore((s) => s.reply);
  const favorites = useFavoriteMessageIds();
  const toggleFavorite = useToggleFavoriteMessage();

  if (!url) return <>{children}</>;

  const name = info.name || alt || "imagem";
  const favorite = Boolean(message && (favorites.data ?? []).includes(message.id));

  const copy = (text: string, notice: string) =>
    void copyText(text).then((gave) =>
      gave ? toast.success(notice) : toast.error(t("conversa.mensagem.naoDeuParaCopiar")),
    );

  return (
    <ContextMenu data-gc="conversa.image-viewer-menu.context-menu">
      <ContextMenuTrigger data-gc="conversa.image-viewer-menu.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="conversa.image-viewer-menu.context-menu-content" className="z-[60] w-56">
        {message && (
          <>
            <div data-gc="conversa.image-viewer-menu.div" className="flex gap-1 p-1">
              {QUICK_REACTIONS.map((emoji) => (
                <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item"
                  key={emoji}
                  onSelect={() => void reactToMessage(message.id, emoji, true).catch(() => undefined)}
                  className="flex size-10 items-center justify-center rounded-md bg-surface-3 p-0 text-lg"
                >
                  {emoji}
                </ContextMenuItem>
              ))}
            </div>

            <ContextMenuSeparator data-gc="conversa.image-viewer-menu.context-menu-separator" />

            <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--2"
              onSelect={() => {
                reply({
                  messageId: message.id,
                  channelId: message.channelId,
                  author: message.authorName,
                  authorId: message.authorId,
                });
                close();
              }}
            >
              {t("conversa.acoes.responder")} <CornerUpLeft data-gc="conversa.image-viewer-menu.corner-up-left" size={14} />
            </ContextMenuItem>

            <ContextMenuSeparator data-gc="conversa.image-viewer-menu.context-menu-separator--2" />
          </>
        )}

        <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--3"
          onSelect={() =>
            void copyImage(url).then((gave) =>
              gave ? toast.success(t("conversa.imagem.imagemCopiada")) : toast.error(t("conversa.imagem.naoDeuParaCopiar")),
            )
          }
        >
          {t("conversa.imagem.copiarImagem")} <Copy data-gc="conversa.image-viewer-menu.copy" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--4" onSelect={() => void downloadImage(url, name)}>
          {t("conversa.imagem.baixarImagem")} <Download data-gc="conversa.image-viewer-menu.download" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="conversa.image-viewer-menu.context-menu-separator--3" />

        <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--5"
          onSelect={() => copy(url, t("conversa.imagem.linkCopiado"))}
        >
          {t("conversa.imagem.copiarLinkDaImagem")} <Link2 data-gc="conversa.image-viewer-menu.link2" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--6" onSelect={() => window.open(url, "_blank", "noopener,noreferrer")}>
          {t("conversa.imagem.abrirLinkDaImagem")} <ExternalLink data-gc="conversa.image-viewer-menu.external-link" size={14} />
        </ContextMenuItem>

        <ContextMenuSub data-gc="conversa.image-viewer-menu.context-menu-sub">
          <ContextMenuSubTrigger data-gc="conversa.image-viewer-menu.context-menu-sub-trigger">
            {t("conversa.imagem.maisAcoes")} <Star data-gc="conversa.image-viewer-menu.star" size={14} />
          </ContextMenuSubTrigger>

          <ContextMenuSubContent data-gc="conversa.image-viewer-menu.context-menu-sub-content" className="z-[60]">
            <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--7"
              onSelect={() =>
                window.open(`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer")
              }
            >
              {t("conversa.imagem.pesquisarImagem")} <Search data-gc="conversa.image-viewer-menu.search" size={14} />
            </ContextMenuItem>

            {info.id && (
              <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--8"
                onSelect={() => copy(info.id!, t("conversa.imagem.idCopiado"))}
              >
                {t("conversa.imagem.copiarIdDoAnexo")} <Hash data-gc="conversa.image-viewer-menu.hash" size={14} />
              </ContextMenuItem>
            )}
          </ContextMenuSubContent>
        </ContextMenuSub>

        {message && (
          <>
            <ContextMenuSeparator data-gc="conversa.image-viewer-menu.context-menu-separator--4" />

            <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--9"
              onSelect={() => toggleFavorite.mutate({ messageId: message.id, favorite })}
            >
              {t(favorite ? "conversa.acoes.tirarDosFavoritos" : "conversa.acoes.favoritar")}{" "}
              <Bookmark data-gc="conversa.image-viewer-menu.bookmark" size={14} />
            </ContextMenuItem>

            <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--10"
              onSelect={() => {
                unreadFromMessage(message.channelId, message.id);
                toast.success(t("conversa.mensagem.naoLidasDaqui"));
              }}
            >
              {t("conversa.acoes.marcarNaoLida")} <MailOpen data-gc="conversa.image-viewer-menu.mail-open" size={14} />
            </ContextMenuItem>

            <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--11"
              onSelect={() =>
                copy(
                  `${window.location.origin}/channels/${message.guildId ?? "@me"}/${message.channelId}/${message.id}`,
                  t("conversa.mensagem.linkCopiado"),
                )
              }
            >
              {t("conversa.acoes.copiarLink")} <Link2 data-gc="conversa.image-viewer-menu.link2--2" size={14} />
            </ContextMenuItem>

            <ContextMenuItem data-gc="conversa.image-viewer-menu.context-menu-item--12"
              onSelect={() => copy(message.id, t("conversa.mensagem.idCopiado"))}
            >
              {t("conversa.acoes.copiarId")} <Hash data-gc="conversa.image-viewer-menu.hash--2" size={14} />
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};
