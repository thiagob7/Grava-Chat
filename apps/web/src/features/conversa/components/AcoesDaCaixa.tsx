import React from "react";
import { GifIcon, ImageIcon, Sticker, Smiley } from "@phosphor-icons/react";

import { Tooltip } from "~/components/ui/tooltip";
import { SHORTCUTS, writeCombo } from "~/features/configuracoes/lib/atalhos";
import { cn } from "~/lib/utils";
import { boxButtonClass } from "~/components/ui/button";
import { useTranslation } from "~/traducao";

export const BoxButton: React.FC<{
  label: string;
  shortcut?: string[];
  active?: boolean;
  off?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ label, shortcut, active, off, onClick, children }) => (
  <Tooltip data-gc="conversa.acoes-da-caixa.tooltip" label={label} shortcut={shortcut}>
    <button data-gc="conversa.acoes-da-caixa.button.on-click"
      type="button"
      onClick={onClick}
      disabled={off}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        boxButtonClass,
        active ? "bg-hover text-ink" : "text-ink-muted hover:bg-hover hover:text-ink",
      )}
    >
      {children}
    </button>
  </Tooltip>
);

const shortcut = (id: string) => {
  const match = SHORTCUTS.find((a) => a.id === id);

  return match ? writeCombo(match.fallback).split(" ") : undefined;
};

interface BoxPropsActions {
  canAttach: boolean;
  isOpen: "gifs" | "figurinhas" | "emoji" | null;
  onOpen: (tab: "gifs" | "figurinhas" | "emoji") => void;
  onAttach: () => void;
}

export const BoxActions: React.FC<BoxPropsActions> = ({
  canAttach,
  isOpen,
  onOpen,
  onAttach,
}) => {
  const { t } = useTranslation();

  return (
    <>
      {/*
        Numa caixa estreita sobram ícones e falta campo. GIF e figurinha saem
        primeiro: os dois moram no mesmo seletor que o emoji abre, então nada
        fica inalcançável — é um toque a mais, não um caminho a menos.

        A medida é do contêiner, não da tela: o que aperta a caixa é a largura
        DELA, e ela também encolhe no desktop quando abre a lista de membros.
      */}
      <span data-gc="conversa.acoes-da-caixa.span" className="hidden @md:flex">
        <BoxButton data-gc="conversa.acoes-da-caixa.box-button" label="GIFs" active={isOpen === "gifs"} onClick={() => onOpen("gifs")}>
          <GifIcon data-gc="conversa.acoes-da-caixa.gif-icon" size={20} />
        </BoxButton>
      </span>

      <BoxButton data-gc="conversa.acoes-da-caixa.box-button.on-attach" label={t("conversa.caixa.enviarArquivo")} off={!canAttach} onClick={onAttach}>
        <ImageIcon data-gc="conversa.acoes-da-caixa.image-icon" size={20} />
      </BoxButton>

      <span data-gc="conversa.acoes-da-caixa.span--2" className="hidden @md:flex">
        <BoxButton data-gc="conversa.acoes-da-caixa.box-button--2"
          label="Figurinhas"
          active={isOpen === "figurinhas"}
          onClick={() => onOpen("figurinhas")}
        >
          <Sticker data-gc="conversa.acoes-da-caixa.sticker" size={20} />
        </BoxButton>
      </span>

      <BoxButton data-gc="conversa.acoes-da-caixa.box-button--3"
        label="Emojis"
        shortcut={shortcut("expressoes")}
        active={isOpen === "emoji"}
        onClick={() => onOpen("emoji")}
      >
        <Smiley data-gc="conversa.acoes-da-caixa.smiley" size={20} />
      </BoxButton>
    </>
  );
};
