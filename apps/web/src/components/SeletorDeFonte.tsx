import React, { useEffect } from "react";
import { TextAa } from "@phosphor-icons/react";
import { NAME_FONTS, type NameFont } from "@gravae/shared";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Tooltip } from "~/components/ui/tooltip";
import { FONTS } from "~/features/perfil/lib/catalogo";
import { loadAllFonts, fontFamily } from "~/features/perfil/lib/fontes";
import { cn } from "~/lib/utils";
import { boxButtonClass } from "~/components/ui/button";
import { useTranslation } from "~/traducao";

const KEY = "gravae:fonte-da-mensagem";

export function readFontSaves(): NameFont {
  try {
    const saves = localStorage.getItem(KEY);
    return NAME_FONTS.includes(saves as NameFont) ? (saves as NameFont) : "padrao";
  } catch {
    return "padrao";
  }
}

export function storeFont(font: NameFont) {
  try {
    localStorage.setItem(KEY, font);
  } catch {
  }
}

export const FontIcon: React.FC<{ size: number }> = ({ size }) => (
  <TextAa data-gc="seletor-de-fonte.text-aa" size={size} />
);

interface FontPropsPicker {
  font: NameFont;
  onPick: (font: NameFont) => void;
  disabled?: boolean;
}

export const FontPicker: React.FC<FontPropsPicker> = ({
  font,
  onPick,
  disabled,
}) => {
  const { t } = useTranslation();

  useEffect(() => loadAllFonts(), []);

  const label = FONTS.find((f) => f.id === font)?.label ?? t("comum.fonte.padrao");

  return (
    <DropdownMenu data-gc="seletor-de-fonte.dropdown-menu">
      <Tooltip data-gc="seletor-de-fonte.tooltip" label={t("comum.fonte.comNome", { fonte: label })}>
        <DropdownMenuTrigger data-gc="seletor-de-fonte.dropdown-menu-trigger" asChild disabled={disabled}>
          <button data-gc="seletor-de-fonte.button"
            aria-label={t("comum.fonte.rotulo")}
            className={cn(
              boxButtonClass,
              font === "padrao"
                ? "text-ink-muted hover:bg-hover hover:text-ink"
                : "text-brand hover:bg-hover",
            )}
          >
            <FontIcon data-gc="seletor-de-fonte.font-icon" size={20} />
          </button>
        </DropdownMenuTrigger>
      </Tooltip>

      <DropdownMenuContent data-gc="seletor-de-fonte.dropdown-menu-content"
        side="top"
        align="end"
        className="min-w-44"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {FONTS.map((option) => (
          <DropdownMenuItem data-gc="seletor-de-fonte.dropdown-menu-item"
            key={option.id}
            onSelect={() => onPick(option.id)}
            className={cn("text-base", option.id === font && "text-brand")}
            style={{ fontFamily: fontFamily(option.id) ?? undefined }}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
