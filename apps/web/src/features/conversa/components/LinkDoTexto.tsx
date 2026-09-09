import React from "react";
import { useNavigate } from "react-router";
import { idDoTemaNoLink } from "@gravae/shared";

import { useImportarTema } from "~/features/tema/stores/importar-tema";
import { flxCls } from "~/lib/compat-de-tema";
import { cn } from "~/lib/utils";

export const LinkDoTexto: React.FC<{ url: string }> = ({ url }) => {
  const navigate = useNavigate();
  const abrirTema = useImportarTema((s) => s.abrir);

  const daCasa = (() => {
    try {
      return new URL(url, window.location.origin).origin === window.location.origin;
    } catch {
      return false;
    }
  })();

  return (
    <a data-gc="conversa.link-do-texto.a"
      href={url}
      target={daCasa ? undefined : "_blank"}
      rel="noreferrer noopener"
      className={cn("text-link hover:underline", flxCls("linkNoTexto"))}
      onClick={(evento) => {
        if (!daCasa || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.button !== 0) return;

        evento.preventDefault();

        const tema = idDoTemaNoLink(url, window.location.origin);
        if (tema) {
          abrirTema(tema);
          return;
        }

        const endereco = new URL(url, window.location.origin);
        navigate(`${endereco.pathname}${endereco.search}${endereco.hash}`);
      }}
    >
      {url}
    </a>
  );
};
