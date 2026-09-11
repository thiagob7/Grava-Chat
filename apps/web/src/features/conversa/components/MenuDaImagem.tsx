import React from "react";
import { Copy, Download, ExternalLink, Hash, Link2, Search, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { Attachment } from "@gravae/shared";

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
import { copyText } from "~/lib/copiar";
import { downloadImage, copyImage } from "~/lib/imagem";

export const ImageMenu: React.FC<{ attachment: Attachment; children: React.ReactNode }> = ({
  attachment,
  children,
}) => {
  const { t } = useTranslation();
  const name = attachment.filename || "imagem";

  return (
    <ContextMenu data-gc="conversa.menu-da-imagem.context-menu">
      <ContextMenuTrigger data-gc="conversa.menu-da-imagem.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="conversa.menu-da-imagem.context-menu-content">
        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item"
          onSelect={() =>
            void copyImage(attachment.url).then((gave) =>
              gave
                ? toast.success(t("conversa.imagem.imagemCopiada"))
                : toast.error(t("conversa.imagem.naoDeuParaCopiar")),
            )
          }
        >
          {t("conversa.imagem.copiarImagem")} <Copy data-gc="conversa.menu-da-imagem.copy" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--2" onSelect={() => void downloadImage(attachment.url, name)}>
          {t("conversa.imagem.baixarImagem")} <Download data-gc="conversa.menu-da-imagem.download" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="conversa.menu-da-imagem.context-menu-separator" />

        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--3"
          onSelect={() => void copyText(attachment.url).then(() => toast.success(t("conversa.imagem.linkCopiado")))}
        >
          {t("conversa.imagem.copiarLinkDaImagem")} <Link2 data-gc="conversa.menu-da-imagem.link2" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--4" onSelect={() => window.open(attachment.url, "_blank", "noopener,noreferrer")}>
          {t("conversa.imagem.abrirLinkDaImagem")} <ExternalLink data-gc="conversa.menu-da-imagem.external-link" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="conversa.menu-da-imagem.context-menu-separator--2" />

        <ContextMenuSub data-gc="conversa.menu-da-imagem.context-menu-sub">
          <ContextMenuSubTrigger data-gc="conversa.menu-da-imagem.context-menu-sub-trigger">
            {t("conversa.imagem.maisAcoes")} <Star data-gc="conversa.menu-da-imagem.star" size={14} />
          </ContextMenuSubTrigger>

          <ContextMenuSubContent data-gc="conversa.menu-da-imagem.context-menu-sub-content">
            <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--5"
              onSelect={() =>
                window.open(
                  `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(attachment.url)}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              {t("conversa.imagem.pesquisarImagem")} <Search data-gc="conversa.menu-da-imagem.search" size={14} />
            </ContextMenuItem>

            <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--6"
              onSelect={() => void copyText(attachment.id).then(() => toast.success(t("conversa.imagem.idCopiado")))}
            >
              {t("conversa.imagem.copiarIdDoAnexo")} <Hash data-gc="conversa.menu-da-imagem.hash" size={14} />
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};
