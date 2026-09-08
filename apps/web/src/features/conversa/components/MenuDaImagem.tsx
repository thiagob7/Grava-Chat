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
import { copiarTexto } from "~/lib/copiar";
import { baixarImagem, copiarImagem } from "~/lib/imagem";

/*
  O botão direito numa imagem.

  Só o que é da imagem mora aqui — copiar, baixar, o link, o id do anexo. O
  que é da mensagem (responder, encaminhar, fixar) continua na barra que
  aparece ao passar o mouse, que é onde já estava e onde a pessoa procura.
*/
export const MenuDaImagem: React.FC<{ anexo: Attachment; children: React.ReactNode }> = ({
  anexo,
  children,
}) => {
  const { t } = useTranslation();
  const nome = anexo.filename || "imagem";

  return (
    <ContextMenu data-gc="conversa.menu-da-imagem.context-menu">
      <ContextMenuTrigger data-gc="conversa.menu-da-imagem.context-menu-trigger" asChild>{children}</ContextMenuTrigger>

      <ContextMenuContent data-gc="conversa.menu-da-imagem.context-menu-content">
        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item"
          onSelect={() =>
            void copiarImagem(anexo.url).then((deu) =>
              deu
                ? toast.success(t("conversa.imagem.imagemCopiada"))
                : toast.error(t("conversa.imagem.naoDeuParaCopiar")),
            )
          }
        >
          {t("conversa.imagem.copiarImagem")} <Copy data-gc="conversa.menu-da-imagem.copy" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--2" onSelect={() => void baixarImagem(anexo.url, nome)}>
          {t("conversa.imagem.baixarImagem")} <Download data-gc="conversa.menu-da-imagem.download" size={14} />
        </ContextMenuItem>

        <ContextMenuSeparator data-gc="conversa.menu-da-imagem.context-menu-separator" />

        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--3"
          onSelect={() => void copiarTexto(anexo.url).then(() => toast.success(t("conversa.imagem.linkCopiado")))}
        >
          {t("conversa.imagem.copiarLinkDaImagem")} <Link2 data-gc="conversa.menu-da-imagem.link2" size={14} />
        </ContextMenuItem>

        <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--4" onSelect={() => window.open(anexo.url, "_blank", "noopener,noreferrer")}>
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
                  `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(anexo.url)}`,
                  "_blank",
                  "noopener,noreferrer",
                )
              }
            >
              {t("conversa.imagem.pesquisarImagem")} <Search data-gc="conversa.menu-da-imagem.search" size={14} />
            </ContextMenuItem>

            <ContextMenuItem data-gc="conversa.menu-da-imagem.context-menu-item--6"
              onSelect={() => void copiarTexto(anexo.id).then(() => toast.success(t("conversa.imagem.idCopiado")))}
            >
              {t("conversa.imagem.copiarIdDoAnexo")} <Hash data-gc="conversa.menu-da-imagem.hash" size={14} />
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
      </ContextMenuContent>
    </ContextMenu>
  );
};
